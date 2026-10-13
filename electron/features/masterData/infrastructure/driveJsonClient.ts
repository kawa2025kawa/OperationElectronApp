// electron/features/masterData/infrastructure/driveJsonClient.ts

import { authService } from "@electron/features/auth/authService";
import { TextDecoder } from "node:util";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const MASTER_FOLDER_ID = "1eIAgbP2nIwm_tB4YnzCaHnDkvNCT0OLA";

interface DriveFile {
  id: string;
  name: string;
}

interface DriveFileListResponse {
  files?: DriveFile[];
}

/**
 * UTF-8 専用で JSON のバイト列をデコードする。
 *
 * - UTF-8 BOM は許可しない
 * - 不正な UTF-8 バイト列はエラー
 * - Windows-31J などへのフォールバックは行わない
 */
function decodeJsonBuffer(buffer: Buffer, fileName: string): string {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    throw new Error(
      `${fileName} は UTF-8 BOM 付きです。UTF-8（BOM なし）で保存してください。`,
    );
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).trim();
  } catch (error) {
    throw new Error(
      `${fileName} は有効な UTF-8 ではありません。UTF-8（BOM なし）で保存してください。`,
      { cause: error },
    );
  }
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function fetchDriveJson<T extends object>(
  fileName: string,
): Promise<T[]> {
  if (!fileName.trim()) {
    throw new Error("取得する JSON ファイル名が指定されていません。");
  }

  const query = [
    `'${MASTER_FOLDER_ID}' in parents`,
    `name = '${escapeDriveQueryValue(fileName)}'`,
    "mimeType != 'application/vnd.google-apps.folder'",
    "trashed = false",
  ].join(" and ");

  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    pageSize: "100",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const list = await authService.getJson<DriveFileListResponse>(
    `${DRIVE_API_BASE_URL}/files?${params.toString()}`,
  );

  const files = list.files ?? [];

  if (files.length === 0) {
    throw new Error(
      `Google Drive の指定フォルダに ${fileName} が見つかりません。`,
    );
  }

  if (files.length > 1) {
    throw new Error(
      `Google Drive の指定フォルダに ${fileName} が複数あります。`,
    );
  }

  const file = files[0];

  if (!file.id) {
    throw new Error(`${fileName} のファイル ID がありません。`);
  }

  const response = await authService.request(
    `${DRIVE_API_BASE_URL}/files/${encodeURIComponent(file.id)}?alt=media`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(
      `${fileName} の取得に失敗しました (${response.status}): ${detail}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = decodeJsonBuffer(buffer, fileName);

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;

    console.error(`[DriveJsonClient] ${fileName} JSONパースエラー情報:`, {
      length: text.length,
      preview,
      error,
    });

    throw new Error(
      `${fileName} は有効な JSON ではありません。(サイズ: ${text.length}文字, 先頭内容: ${JSON.stringify(preview)})`,
      { cause: error },
    );
  }

  let rows: unknown[];

  if (Array.isArray(parsed)) {
    rows = parsed;
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    "data" in parsed &&
    Array.isArray(parsed.data)
  ) {
    rows = parsed.data;
  } else {
    throw new Error(
      `${fileName} のルートは配列、または { "data": [...] } にしてください。`,
    );
  }

  if (
    !rows.every(
      (row: unknown): row is Record<string, unknown> =>
        typeof row === "object" && row !== null && !Array.isArray(row),
    )
  ) {
    throw new Error(`${fileName} にオブジェクト以外の要素があります。`);
  }

  return rows as T[];
}

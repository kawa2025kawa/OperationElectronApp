// electron/features/operation/application/statusSheetSyncService.ts

import { format } from "date-fns";
import {
  authService,
  GoogleAuthError,
} from "@electron/features/auth/authService";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { persistActiveFlags } from "@electron/features/operation/infrastructure/storage/activeFlagsStorage";
import { persistStatusesImmediately } from "@electron/features/operation/infrastructure/storage/statusStorage";
import type {
  LoadStatusSyncResult,
  SaveStatusSyncInput,
  SaveStatusSyncResult,
  StatusSyncMetadata,
  StatusSyncPreviewResult,
} from "@shared/types/electron/ipcTypes";
import {
  DEFAULT_ACTIVE_FLAGS,
  JOB_STATUS_VALUES,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { getActiveFlags } from "./statusFlagService";
import { notifyStatusUpdated } from "./statusNotifier";
import { statusState } from "./statusState";

const STATUS_SYNC_SHEET_CONFIG = {
  apiBaseUrl: "https://sheets.googleapis.com/v4/spreadsheets",
  spreadsheetId: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
  sheetName: "OperationStatusSync",
  dateTimeFormat: "yyyy/MM/dd HH:mm:ss",
} as const;

// A〜F列: Status一覧 / G列: 空列 / H〜L列(index 7〜11): メタ情報(2行目 H2:L2)
const COLUMN_LAYOUT = {
  headerRowIndex: 0,
  dataStartRowIndex: 1,
  updatedAtColIndex: 5, // F列: updatedAt
  metaStartColIndex: 7, // H列 (0-based: A=0 ... G=6, H=7)
} as const;

const STATUS_HEADER_ROW = [
  "kanriNo",
  "status",
  "comment",
  "startTime",
  "endTime",
  "updatedAt",
] as const;

const META_HEADER_ROW = [
  "operatorName",
  "handoverNote",
  "is1CActive",
  "is2CActive",
  "is3CActive",
] as const;

function isValidJobStatus(value: string): value is JobStatus {
  return (JOB_STATUS_VALUES as readonly string[]).includes(value);
}

function parseBooleanCell(value?: string): boolean {
  return value?.trim().toUpperCase() === "TRUE";
}

function formatDateTime(date = new Date()): string {
  return format(date, STATUS_SYNC_SHEET_CONFIG.dateTimeFormat);
}

function getQuotedSheetName(): string {
  return `'${STATUS_SYNC_SHEET_CONFIG.sheetName.replace(/'/g, "''")}'`;
}

function buildValuesUrl(suffix = "", query = ""): string {
  const spreadsheetId = encodeURIComponent(
    STATUS_SYNC_SHEET_CONFIG.spreadsheetId,
  );
  const range = encodeURIComponent(getQuotedSheetName());
  const queryString = query ? `?${query}` : "";
  return `${STATUS_SYNC_SHEET_CONFIG.apiBaseUrl}/${spreadsheetId}/values/${range}${suffix}${queryString}`;
}

async function withGoogleAuthErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      throw new Error("Google認証が必要です。再ログインしてください。", {
        cause: error,
      });
    }
    throw error;
  }
}

async function requestSheetValues(
  url: string,
  init: RequestInit | undefined,
  errorLabel: string,
): Promise<string> {
  const response = await authService.request(url, init);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `${errorLabel} (${response.status}): ${responseText || "不明なエラー"}`,
    );
  }

  return responseText;
}

/** 2行目の H〜L列（index 7〜11）および F列（updatedAt）からメタ情報を取得する */
function parseMetadataFromRows(
  dataRows: string[][],
): StatusSyncMetadata | null {
  const firstRow = dataRows[0];
  if (!firstRow) return null;

  const metaCells = firstRow.slice(
    COLUMN_LAYOUT.metaStartColIndex,
    COLUMN_LAYOUT.metaStartColIndex + META_HEADER_ROW.length,
  );

  const savedAtFromColumnF =
    dataRows
      .map((row) => (row[COLUMN_LAYOUT.updatedAtColIndex] ?? "").trim())
      .find((value) => Boolean(value)) ?? "";

  if (metaCells.every((cell) => !cell?.trim()) && !savedAtFromColumnF) {
    return null;
  }

  return {
    operatorName: (metaCells[0] ?? "").trim(),
    handoverNote: metaCells[1] ?? "",
    activeFlags: {
      is1CActive: parseBooleanCell(metaCells[2]),
      is2CActive: parseBooleanCell(metaCells[3]),
      is3CActive: parseBooleanCell(metaCells[4]),
    },
    savedAt: savedAtFromColumnF,
    revision: 0,
  };
}

/** 2行目以降の A〜E列（index 0〜4）から Status 行をパースする */
function parseStatusFromRow(row: string[]): OperationStatusState | null {
  const kanriNo = normalizeKanriNo(row[0] ?? "");
  if (!kanriNo) return null;

  const rawStatus = (row[1] ?? "").trim();
  const status: JobStatus | undefined = isValidJobStatus(rawStatus)
    ? rawStatus
    : undefined;

  return {
    kanriNo,
    status,
    comment: row[2] ?? "",
    startTime: row[3]?.trim() ? row[3].trim() : null,
    endTime: row[4]?.trim() ? row[4].trim() : null,
  };
}

async function fetchRawSheetRows(): Promise<string[][]> {
  const responseText = await requestSheetValues(
    buildValuesUrl(),
    undefined,
    "スプレッドシート読込失敗",
  );
  const json = JSON.parse(responseText) as { values?: string[][] };
  return json.values ?? [];
}

/**
 * 1行目: A〜F列ヘッダー + G列空 + H〜L列ヘッダー
 * 2行目: 先頭Status（A〜F列） + G列空 + H2:L2メタ値
 * 3行目以降: 残りStatus（A〜F列）
 */
function buildSavePayloadRows(metadata: StatusSyncMetadata): string[][] {
  const headerRow: string[] = [
    ...STATUS_HEADER_ROW,
    "", // G列（空列）
    ...META_HEADER_ROW,
  ];

  const metaValues: string[] = [
    metadata.operatorName,
    metadata.handoverNote,
    metadata.activeFlags.is1CActive ? "TRUE" : "FALSE",
    metadata.activeFlags.is2CActive ? "TRUE" : "FALSE",
    metadata.activeFlags.is3CActive ? "TRUE" : "FALSE",
  ];

  const statusEntries = [...statusState.statuses.entries()];
  const totalDataRows = Math.max(statusEntries.length, 1);
  const rows: string[][] = [headerRow];

  for (let i = 0; i < totalDataRows; i += 1) {
    const entry = statusEntries[i];
    const statusCells = entry
      ? [
          entry[0],
          entry[1].status ?? "",
          entry[1].comment ?? "",
          entry[1].startTime ?? "",
          entry[1].endTime ?? "",
          metadata.savedAt,
        ]
      : ["", "", "", "", "", metadata.savedAt];

    if (i === 0) {
      rows.push([...statusCells, "", ...metaValues]);
    } else {
      rows.push(statusCells);
    }
  }

  return rows;
}

/** LOADモーダル表示用に前回の保存情報を取得する */
export async function previewStatusSyncFromSpreadsheet(): Promise<StatusSyncPreviewResult> {
  return withGoogleAuthErrorHandling(async () => {
    const values = await fetchRawSheetRows();
    const dataRows = values.slice(COLUMN_LAYOUT.dataStartRowIndex);

    if (dataRows.length === 0) {
      return { hasData: false, metadata: null };
    }

    const metadata = parseMetadataFromRows(dataRows);
    const hasStatusRows = dataRows.some((row) =>
      Boolean(normalizeKanriNo(row[0] ?? "")),
    );

    if (!metadata && !hasStatusRows) {
      return { hasData: false, metadata: null };
    }

    return {
      hasData: true,
      metadata,
    };
  });
}

/** 現在の全Status・ActiveFlags・引き継ぎ情報を一括でスプレッドシートへ保存する */
export async function saveStatusesToSpreadsheet(
  input: SaveStatusSyncInput,
): Promise<SaveStatusSyncResult> {
  return withGoogleAuthErrorHandling(async () => {
    const metadata: StatusSyncMetadata = {
      operatorName: input.operatorName.trim() || "不明",
      savedAt: formatDateTime(),
      handoverNote: input.handoverNote.trim(),
      revision: 0,
      activeFlags: getActiveFlags(),
    };

    const rows = buildSavePayloadRows(metadata);

    await requestSheetValues(
      buildValuesUrl(":clear"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
      "シートクリア失敗",
    );

    await requestSheetValues(
      buildValuesUrl("", "valueInputOption=RAW"),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: getQuotedSheetName(),
          majorDimension: "ROWS",
          values: rows,
        }),
      },
      "スプレッドシート書き込み失敗",
    );

    return {
      ...metadata,
      savedCount: statusState.statuses.size,
    };
  });
}

/** スプレッドシートから前回のStatusとActiveFlagsを読み込み、現在の状態へ復元する */
export async function loadStatusesFromSpreadsheet(): Promise<LoadStatusSyncResult> {
  return withGoogleAuthErrorHandling(async () => {
    const values = await fetchRawSheetRows();
    const loadedAt = formatDateTime();
    const dataRows = values.slice(COLUMN_LAYOUT.dataStartRowIndex);
    const metadata = parseMetadataFromRows(dataRows);

    const restoredFlags: ActiveFlags = metadata?.activeFlags ?? {
      ...DEFAULT_ACTIVE_FLAGS,
    };
    statusState.activeFlags = restoredFlags;
    await persistActiveFlags(restoredFlags);

    if (dataRows.length === 0) {
      return {
        loadedCount: 0,
        metadata,
        loadedAt,
      };
    }

    const parsedStatuses = dataRows
      .map(parseStatusFromRow)
      .filter((item): item is OperationStatusState => item !== null);

    statusState.propagator.clearQueue();
    statusState.statuses.clear();

    for (const nextState of parsedStatuses) {
      statusState.statuses.set(nextState.kanriNo, nextState);
      notifyStatusUpdated(nextState);
    }

    await persistStatusesImmediately(statusState.statuses);

    return {
      loadedCount: parsedStatuses.length,
      metadata,
      loadedAt,
    };
  });
}

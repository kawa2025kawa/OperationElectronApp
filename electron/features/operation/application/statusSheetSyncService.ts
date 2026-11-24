// electron/features/operation/application/statusSheetSyncService.ts

import { format } from "date-fns";
import { authService } from "@electron/features/auth/authService";
import {
  GoogleAuthError,
  googleApiRequest,
} from "@electron/features/auth/googleApiClient";
import {
  buildSheetValuesUrl,
  quoteSheetName,
} from "@electron/features/masterData/infrastructure/googleSheetsHelper";
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
  type ActiveFlags,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { getActiveFlags } from "./statusFlagService";
import { notifyStatusUpdated } from "./statusNotifier";
import {
  buildSavePayloadRows,
  parseMetadataFromRows,
  parseStatusFromRow,
  STATUS_SYNC_COLUMN_LAYOUT,
} from "./statusSheetSyncMapper";
import { statusState } from "./statusState";

const STATUS_SYNC_SHEET_CONFIG = {
  spreadsheetId: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
  sheetName: "OperationStatusSync",
  dateTimeFormat: "yyyy/MM/dd HH:mm:ss",
} as const;

function formatDateTime(date = new Date()): string {
  return format(date, STATUS_SYNC_SHEET_CONFIG.dateTimeFormat);
}

function buildValuesUrl(suffix = "", query = ""): string {
  return buildSheetValuesUrl(
    STATUS_SYNC_SHEET_CONFIG.spreadsheetId,
    STATUS_SYNC_SHEET_CONFIG.sheetName,
    suffix,
    query,
  );
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
  const response = await googleApiRequest(url, init);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `${errorLabel} (${response.status}): ${responseText || "不明なエラー"}`,
    );
  }

  return responseText;
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

/** LOADモーダル表示用に前回の保存情報を取得する */
export async function previewStatusSyncFromSpreadsheet(): Promise<StatusSyncPreviewResult> {
  return withGoogleAuthErrorHandling(async () => {
    const values = await fetchRawSheetRows();
    const dataRows = values.slice(STATUS_SYNC_COLUMN_LAYOUT.dataStartRowIndex);

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
    const session = await authService.loadSession();
    const operatorName =
      input.operatorName?.trim() ||
      session?.familyName?.trim() ||
      session?.email?.trim() ||
      "担当者";

    const metadata: StatusSyncMetadata = {
      operatorName,
      savedAt: formatDateTime(),
      handoverNote: input.handoverNote.trim(),
      revision: 0,
      activeFlags: getActiveFlags(),
    };

    const rows = buildSavePayloadRows(statusState.statuses, metadata);

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
          range: quoteSheetName(STATUS_SYNC_SHEET_CONFIG.sheetName),
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
    const dataRows = values.slice(STATUS_SYNC_COLUMN_LAYOUT.dataStartRowIndex);
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

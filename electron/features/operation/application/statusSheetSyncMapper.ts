// electron/features/operation/application/statusSheetSyncMapper.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type { StatusSyncMetadata } from "@shared/types/electron/ipcTypes";
import {
  JOB_STATUS_VALUES,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

// A〜F列: Status一覧 / G列: 空列 / H〜L列(index 7〜11): メタ情報(2行目 H2:L2)
export const STATUS_SYNC_COLUMN_LAYOUT = {
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

/** 2行目の H〜L列（index 7〜11）および F列（updatedAt）からメタ情報を取得する */
export function parseMetadataFromRows(
  dataRows: string[][],
): StatusSyncMetadata | null {
  const firstRow = dataRows[0];
  if (!firstRow) return null;

  const metaCells = firstRow.slice(
    STATUS_SYNC_COLUMN_LAYOUT.metaStartColIndex,
    STATUS_SYNC_COLUMN_LAYOUT.metaStartColIndex + META_HEADER_ROW.length,
  );

  const savedAtFromColumnF =
    dataRows
      .map((row) => (row[STATUS_SYNC_COLUMN_LAYOUT.updatedAtColIndex] ?? "").trim())
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
export function parseStatusFromRow(row: string[]): OperationStatusState | null {
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

/**
 * 1行目: A〜F列ヘッダー + G列空 + H〜L列ヘッダー
 * 2行目: 先頭Status（A〜F列） + G列空 + H2:L2メタ値
 * 3行目以降: 残りStatus（A〜F列）
 */
export function buildSavePayloadRows(
  statuses: ReadonlyMap<string, OperationStatusState>,
  metadata: StatusSyncMetadata,
): string[][] {
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

  const statusEntries = [...statuses.entries()];
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
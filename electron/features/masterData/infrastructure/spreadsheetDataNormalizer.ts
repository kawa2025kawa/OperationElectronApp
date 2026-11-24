// electron/features/masterData/infrastructure/spreadsheetDataNormalizer.ts

import { randomUUID } from "node:crypto";
import type { SpreadsheetMasterData } from "../types/internalSpreadsheetMasterDataTypes";
import {
  WORK_TYPE,
  type IrregularMaster,
  type OperationLink,
  type OperationMaster,
  type OperationWorkType,
} from "@shared/types/operation/operationTypes";

const DEFAULT_LINK_LABELS = ["リンク1", "リンク2", "リンク3"] as const;

function hasValidJobId(jobId: unknown): boolean {
  if (typeof jobId !== "string") {
    return false;
  }

  const trimmed = jobId.trim();
  return Boolean(trimmed && trimmed !== "-");
}

function normalizeWorkType(
  value: unknown,
  jobId?: unknown,
): OperationWorkType {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === WORK_TYPE.AUTO) {
      return WORK_TYPE.AUTO;
    }

    if (trimmed === WORK_TYPE.IMMEDIATE) {
      return hasValidJobId(jobId) ? WORK_TYPE.IMMEDIATE : WORK_TYPE.MANUAL;
    }
  }

  return WORK_TYPE.MANUAL;
}

function normalizeScheduledTime(value: unknown): string {
  if (typeof value !== "string") {
    return "-";
  }

  const trimmed = value.trim();
  if (!trimmed || /^[-‐‑–—―−ー]$/.test(trimmed)) {
    return "-";
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours <= 23 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${match[2]}`;
    }
  }

  return "-";
}

// レコードのキーと文字列値を正規化する。
function normalizeRow<T extends object>(row: T): T {
  if (row == null || typeof row !== "object") {
    return {} as T;
  }

  const normalized = Object.fromEntries(
    Object.entries(row).map(([rawKey, value]) => {
      const cleanKey = rawKey.replace(/^\uFEFF/, "").trim();
      let cleanValue = value;

      if (typeof value === "string") {
        cleanValue = value.trim();
      } else if (value === null || value === undefined) {
        cleanValue = "";
      } else if (typeof value === "number") {
        cleanValue = String(value);
      }

      return [cleanKey, cleanValue];
    }),
  );

  if (typeof normalized.gmail === "string") {
    const gmail = normalized.gmail.toUpperCase();

    if (gmail === "TRUE") {
      normalized.gmail = true;
    } else if (gmail === "FALSE") {
      normalized.gmail = false;
    }
  }

  return normalized as T;
}

// レコード一覧を正規化する。
export function normalizeSpreadsheetRows<T extends object>(rows: T[]): T[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(normalizeRow);
}

// アプリ内部で使用する行IDを付与する。
function normalizeRowsWithId<T extends { id: string }>(rows: T[]): T[] {
  const seenIds = new Set<string>();
  return rows.map((row, index) => {
    let id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : "";
    if (!id || seenIds.has(id)) {
      id = id ? `${id}_${index}` : randomUUID();
    }
    seenIds.add(id);

    return {
      ...row,
      id,
    };
  });
}

// シートのリンク先パスとラベルをOperationLink形式に変換する。
function normalizeLinks<T extends OperationMaster | IrregularMaster>(
  item: T,
): T {
  const configs = [
    { path: item.link1, label: item.link1Label },
    { path: item.link2, label: item.link2Label },
    { path: item.link3, label: item.link3Label },
  ];

  const links: OperationLink[] = configs.flatMap((cfg, index) => {
    const trimmedPath = cfg.path?.trim();

    if (!trimmedPath || trimmedPath === "-") {
      return [];
    }

    const trimmedLabel = cfg.label?.trim();
    const finalLabel =
      trimmedLabel && trimmedLabel !== "-"
        ? trimmedLabel
        : DEFAULT_LINK_LABELS[index];

    return [{ label: finalLabel, path: trimmedPath }];
  });

  return {
    ...item,
    workType: normalizeWorkType(item.workType, item.jobId),
    scheduledTime: normalizeScheduledTime(item.scheduledTime),
    links: links.length > 0 ? links : item.links,
  };
}

// 不定期運用データの周期指定を統合する。
function normalizeIrregulars(rows: IrregularMaster[]): IrregularMaster[] {
  return rows.map((item) =>
    normalizeLinks({
      ...item,
      cycle: [item.cycle1, item.cycle2, item.cycle]
        .filter(
          (value): value is string => typeof value === "string" && value !== "",
        )
        .join(","),
    }),
  );
}

// スプレッドシートのマスターデータを正規化する（行ごとの文字列正規化は fetchSheet 側で実施済み）。
export function normalizeSpreadsheetMasterData(
  data: SpreadsheetMasterData,
): SpreadsheetMasterData {
  return {
    stores: data.stores ?? [],
    kokyuhyos: normalizeRowsWithId(data.kokyuhyos ?? []),
    jugyoin: normalizeRowsWithId(data.jugyoin ?? []),
    kokyuhyoTantous: data.kokyuhyoTantous ?? [],
    operations: (data.operations ?? []).map(normalizeLinks),
    irregulars: normalizeIrregulars(data.irregulars ?? []),
    todayIrregulars: (data.todayIrregulars ?? []).map(normalizeLinks),
    rdps: data.rdps ?? [],
    dailyUpdateStatus: data.dailyUpdateStatus,
    errors: { ...data.errors },
  };
}

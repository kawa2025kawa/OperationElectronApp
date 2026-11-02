// electron/features/masterData/infrastructure/spreadsheetDataNormalizer.ts

import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import type {
  IrregularMaster,
  OperationLink,
  OperationMaster,
} from "@shared/types/operation/operationTypes";

const DEFAULT_LINK_LABELS = ["リンク1", "リンク2", "リンク3"] as const;

// 文字列の空白とgmailのboolean表現を正規化する。
export function normalizeSpreadsheetRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
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
    links: links.length > 0 ? links : item.links,
  };
}

// スプレッドシートのマスターデータを正規化する。
export function normalizeSpreadsheetMasterData(
  data: SpreadsheetMasterData,
): SpreadsheetMasterData {
  const operations = normalizeSpreadsheetRows(data.operations ?? []).map(
    normalizeLinks,
  );

  const irregulars = normalizeSpreadsheetRows(data.irregulars ?? []).map(
    (item) =>
      normalizeLinks({
        ...item,
        cycle: [item.cycle1, item.cycle2, item.cycle]
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim() !== "",
          )
          .join(","),
      }),
  );

  return {
    stores: normalizeSpreadsheetRows(data.stores ?? []),
    kokyuhyos: normalizeSpreadsheetRows(data.kokyuhyos ?? []),
    jugyoin: normalizeSpreadsheetRows(data.jugyoin ?? []),
    kokyuhyoTantous: normalizeSpreadsheetRows(data.kokyuhyoTantous ?? []),
    operations,
    irregulars,
    todayIrregulars: normalizeSpreadsheetRows(data.todayIrregulars ?? []).map(
      normalizeLinks,
    ),
    rdps: normalizeSpreadsheetRows(data.rdps ?? []),
  };
}

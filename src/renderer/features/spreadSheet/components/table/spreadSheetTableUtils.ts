// src/renderer/features/spreadSheet/components/table/spreadSheetTableUtils.ts

import type { SpreadSheetColumnMeta } from "./spreadsheetTableConfig";

type ColumnAlign = NonNullable<SpreadSheetColumnMeta["align"]>;

export function getColumnAlign(meta: unknown): ColumnAlign {
  const align = (meta as SpreadSheetColumnMeta | undefined)?.align;

  return align === "center" || align === "right" ? align : "left";
}

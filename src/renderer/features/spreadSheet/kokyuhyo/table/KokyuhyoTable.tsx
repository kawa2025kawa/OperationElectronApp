// src/renderer/features/spreadSheet/kokyuhyo/table/KokyuhyoTable.tsx

import { memo } from "react";
import type { Kokyuhyo } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Column } from "@shared/types/table/tableType";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { KOKYUHYO_COLUMNS } from "../../utils/spreadsheetDateUtils";
import * as styles from "@renderer/features/spreadSheet/components/table/spreadsheetTable.css";

export interface KokyuhyoTableProps {
  readonly rows: readonly Kokyuhyo[];
  readonly selectedId?: string;
  readonly onRowClick?: (item: Kokyuhyo) => void;
}

function getCellText(value: unknown): string {
  return value == null || value === "" ? "-" : String(value);
}

function checkIsHolidayText(value: unknown): boolean {
  if (value == null || typeof value === "object") {
    return false;
  }

  const text = String(value);

  return (
    text.includes("公休") ||
    text.includes("有休") ||
    text.includes("特休") ||
    text.includes("休")
  );
}

const getKokyuhyoRowId = (row: Kokyuhyo, index: number): string =>
  row.name ? String(row.name).trim() : String(index);

const renderKokyuhyoCell = (
  _row: Kokyuhyo,
  _col: Column<Kokyuhyo>,
  value: unknown,
) => (
  <span
    className={`${styles.cellText} ${
      checkIsHolidayText(value) ? styles.cellTextHoliday : ""
    }`}
  >
    {getCellText(value)}
  </span>
);

export const KokyuhyoTable = memo(function KokyuhyoTable({
  rows,
  selectedId,
  onRowClick,
}: KokyuhyoTableProps) {
  return (
    <SpreadSheetBaseTable
      rows={rows}
      columns={KOKYUHYO_COLUMNS}
      selectedId={selectedId}
      getRowId={getKokyuhyoRowId}
      onRowClick={onRowClick}
      renderCell={renderKokyuhyoCell}
      headerType="group"
      styles={styles}
    />
  );
});

KokyuhyoTable.displayName = "KokyuhyoTable";

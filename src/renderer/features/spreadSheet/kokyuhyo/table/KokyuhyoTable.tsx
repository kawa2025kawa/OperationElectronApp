// src/renderer/features/spreadSheet/kokyuhyo/table/KokyuhyoTable.tsx

import { memo, useCallback } from "react";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Column } from "@shared/types/table/tableType";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { KOKYUHYO_COLUMNS } from "../kokyuhyoColumns";
import * as styles from "@renderer/styles/global/table.css";

const checkIsHolidayText = (value: unknown): boolean => {
  if (value == null || typeof value === "object") return false;

  const text = String(value);

  return (
    text.includes("公休") ||
    text.includes("有休") ||
    text.includes("特休") ||
    text.includes("休")
  );
};

export interface KokyuhyoTableProps {
  rows: readonly Kokyuhyo[];
  selectedId?: string;
  onRowClick?: (item: Kokyuhyo) => void;
}

export const KokyuhyoTable = memo(
  ({ rows, selectedId, onRowClick }: KokyuhyoTableProps) => {
    const renderCell = useCallback(
      (_row: Kokyuhyo, _col: Column<Kokyuhyo>, value: unknown) => {
        const isHoliday = checkIsHolidayText(value);

        return (
          <span
            className={`${styles.cellText} ${isHoliday ? styles.cellTextHoliday : ""}`}
          >
            {value == null || value === "" ? "-" : String(value)}
          </span>
        );
      },
      [],
    );

    return (
      <SpreadSheetBaseTable
        rows={rows}
        columns={KOKYUHYO_COLUMNS}
        selectedId={selectedId}
        getRowId={(row, index) =>
          row.name ? String(row.name).trim() : String(index)
        }
        onRowClick={onRowClick}
        renderCell={renderCell}
        styles={styles}
      />
    );
  },
);

KokyuhyoTable.displayName = "KokyuhyoTable";

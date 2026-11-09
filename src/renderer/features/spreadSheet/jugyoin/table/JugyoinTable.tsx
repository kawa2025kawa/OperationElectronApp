// src/renderer/features/spreadSheet/jugyoin/table/JugyoinTable.tsx

import { memo } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/spreadsheetTypes";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { JUGYOIN_COLUMNS } from "../../utils/spreadsheetDateUtils";
import * as styles from "@renderer/features/spreadSheet/components/table/spreadsheetTable.css";

export interface JugyoinTableProps {
  readonly rows: readonly Jugyoin[];
  readonly selectedId?: string;
  readonly onRowClick?: (item: Jugyoin) => void;
}

const getJugyoinRowId = (row: Jugyoin, index: number): string =>
  row.name ? String(row.name).trim() : String(index);

export const JugyoinTable = memo(function JugyoinTable({
  rows,
  selectedId,
  onRowClick,
}: JugyoinTableProps) {
  return (
    <SpreadSheetBaseTable
      rows={rows}
      columns={JUGYOIN_COLUMNS}
      selectedId={selectedId}
      getRowId={getJugyoinRowId}
      onRowClick={onRowClick}
      headerType="group"
      styles={styles}
    />
  );
});

JugyoinTable.displayName = "JugyoinTable";

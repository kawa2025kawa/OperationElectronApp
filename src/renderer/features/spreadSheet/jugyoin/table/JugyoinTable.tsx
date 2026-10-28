// src/renderer/features/spreadSheet/jugyoin/table/JugyoinTable.tsx

import { memo } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { JUGYOIN_COLUMNS } from "../jugyoinColumns";
import * as styles from "@renderer/styles/global/table.css";

export interface JugyoinTableProps {
  rows: readonly Jugyoin[];
  selectedId?: string;
  onRowClick?: (item: Jugyoin) => void;
}

export const JugyoinTable = memo(
  ({ rows, selectedId, onRowClick }: JugyoinTableProps) => (
    <SpreadSheetBaseTable
      rows={rows}
      columns={JUGYOIN_COLUMNS}
      selectedId={selectedId}
      getRowId={(row, index) =>
        row.name ? String(row.name).trim() : String(index)
      }
      onRowClick={onRowClick}
      styles={styles}
    />
  ),
);

JugyoinTable.displayName = "JugyoinTable";

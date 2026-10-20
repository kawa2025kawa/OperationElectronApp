// src/renderer/features/spreadsheet/jugyoin/table/JugyoinTable.tsx

import { memo } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { JUGYOIN_COLUMNS } from "../JugyoinView";
import * as styles from "@renderer/styles/global/table.css"; // 🎯 正しい import に修正

export interface JugyoinTableProps {
  rows: readonly Jugyoin[];
  selectedId?: string;
  onRowClick?: (item: Jugyoin) => void;
}

export const JugyoinTable = memo(
  ({ rows, selectedId, onRowClick }: JugyoinTableProps) => {
    return (
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
    );
  },
);

JugyoinTable.displayName = "JugyoinTable";

// src/renderer/features/spreadSheet/shop/table/ShopTable.tsx

import { memo } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { SHOP_COLUMNS } from "../shopColumns";
import * as styles from "@renderer/styles/global/table.css";

export interface ShopTableProps {
  rows: readonly Shop[];
  selectedId?: string;
  onRowClick?: (item: Shop) => void;
}

export const ShopTable = memo(
  ({ rows, selectedId, onRowClick }: ShopTableProps) => (
    <SpreadSheetBaseTable
      rows={rows}
      columns={SHOP_COLUMNS}
      selectedId={selectedId}
      getRowId={(row, index) =>
        row.shopCode ? String(row.shopCode).trim() : String(index)
      }
      onRowClick={onRowClick}
      styles={styles}
    />
  ),
);

ShopTable.displayName = "ShopTable";

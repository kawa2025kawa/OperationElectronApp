// src/renderer/features/spreadSheet/shop/table/ShopTable.tsx

import { memo } from "react";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";
import { SpreadSheetBaseTable } from "../../components/table/SpreadSheetBaseTable";
import { SHOP_COLUMNS } from "@shared/types/spreadsheet/spreadsheetTypes";
import * as styles from "@renderer/features/spreadSheet/components/table/spreadsheetTable.css";

export interface ShopTableProps {
  readonly rows: readonly Shop[];
  readonly selectedId?: string;
  readonly onRowClick?: (item: Shop) => void;
}

const getShopRowId = (row: Shop, index: number): string =>
  row.shopCode ? String(row.shopCode).trim() : String(index);

export const ShopTable = memo(function ShopTable({
  rows,
  selectedId,
  onRowClick,
}: ShopTableProps) {
  return (
    <SpreadSheetBaseTable
      rows={rows}
      columns={SHOP_COLUMNS}
      selectedId={selectedId}
      getRowId={getShopRowId}
      onRowClick={onRowClick}
      headerType="single"
      styles={styles}
    />
  );
});

ShopTable.displayName = "ShopTable";

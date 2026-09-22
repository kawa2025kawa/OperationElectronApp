// src/renderer/features/spreadSheet/components/table/SpreadSheetTable.tsx

import React from "react";
import type { SpreadSheetTableProps } from "@shared/types/table/tableType";
import type { SheetId } from "@shared/types/spreadsheet/sheetTypes";
import * as styles from "./spreadSheetTable.css";
import { useSpreadSheetTable } from "./useSpreadSheetTable";
import { KokyuhyoTableContent } from "./contents/KokyuhyoTableContent";
import { JugyoinTableContent } from "./contents/JugyoinTableContent";
import { ShopTableContent } from "./contents/ShopTableContent";

export interface ExtendedSpreadSheetTableProps<
  T extends object,
> extends SpreadSheetTableProps<T> {
  sheetId?: SheetId | string | null;
}

// 🎯 rowKey を Required にした DispatcherProps を定義
type TableContentDispatcherProps<T extends object> =
  ExtendedSpreadSheetTableProps<T> & {
    rowKey: keyof T | string | ((record: T) => string);
    virtualItems: Array<{ index: number; start: number }>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    totalSize: number;
  };

const TableContentDispatcher = <T extends object>({
  sheetId,
  ...props
}: TableContentDispatcherProps<T>) => {
  switch (sheetId) {
    case "KokyuhyoMasterData":
    case "kokyuhyo":
      return <KokyuhyoTableContent {...props} />;
    case "JugyoinMasterData":
    case "jugyoin":
      return <JugyoinTableContent {...props} />;
    case "StoreMasterData":
    case "shop":
      return <ShopTableContent {...props} />;
    default:
      return <JugyoinTableContent {...props} />;
  }
};

const SpreadSheetTableComponent = <T extends object>({
  data,
  columns,
  rowKey = "id",
  onRowClick,
  selectedId,
  sheetId,
}: ExtendedSpreadSheetTableProps<T>) => {
  const { parentRef, virtualItems, totalSize } = useSpreadSheetTable({ data });

  return (
    <div className={styles.container}>
      {!data || data.length === 0 ? (
        <div className={styles.emptyText}>データがありません</div>
      ) : (
        <TableContentDispatcher
          sheetId={sheetId}
          data={data}
          columns={columns}
          rowKey={rowKey}
          onRowClick={onRowClick}
          selectedId={selectedId}
          virtualItems={virtualItems}
          parentRef={parentRef}
          totalSize={totalSize}
        />
      )}
    </div>
  );
};

export const SpreadSheetTable = React.memo(SpreadSheetTableComponent) as <
  T extends object,
>(
  props: ExtendedSpreadSheetTableProps<T>,
) => React.ReactElement;

SpreadSheetTableComponent.displayName = "SpreadSheetTable";

import React from "react";
import type { SpreadSheetTableProps } from "@shared/types";
import * as styles from "./spreadSheetTable.css";
import { useSpreadSheetTable } from "./useSpreadSheetTable";
import { KokyuhyoTableContent } from "./contents/KokyuhyoTableContent";
import { JugyoinTableContent } from "./contents/JugyoinTableContent";
import { ShopTableContent } from "./contents/ShopTableContent";

interface ExtendedSpreadSheetTableProps<
  T extends object,
> extends SpreadSheetTableProps<T> {
  sheetId?: string;
}

const TableContentDispatcher = <T extends object>({
  sheetId,
  ...props
}: ExtendedSpreadSheetTableProps<T> & {
  virtualItems: Array<{ index: number; start: number }>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  totalSize: number;
}) => {
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
      <div ref={parentRef} className={styles.bodyWrapper}>
        <div
          className={styles.virtualBody}
          style={{ height: `${totalSize}px` }}
        >
          {!data || data.length === 0 ? (
            <div className={styles.emptyText}>データが存在しません</div>
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
      </div>
    </div>
  );
};

export const SpreadSheetTable = React.memo(SpreadSheetTableComponent) as <
  T extends object,
>(
  props: ExtendedSpreadSheetTableProps<T>,
) => React.ReactElement;

SpreadSheetTableComponent.displayName = "SpreadSheetTable";

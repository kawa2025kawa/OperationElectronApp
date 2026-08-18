import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type {
  SpreadSheetTableProps,
  TableRowProps,
} from "@shared/types/spreadsheetTypes";

const ROW_HEIGHT = 56;
const ROW_GAP = 12; // operationTable と同じ余裕を持ったカード間余白
const ROW_SIZE = ROW_HEIGHT + ROW_GAP;

export const useSpreadSheetTable = <T extends object>({
  data,
}: Pick<SpreadSheetTableProps<T>, "data">) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_SIZE,
    overscan: 5,
  });

  return {
    parentRef,
    virtualItems: rowVirtualizer.getVirtualItems(),
    totalSize: rowVirtualizer.getTotalSize(),
  };
};

export const areRowPropsEqual = <T extends object>(
  prev: TableRowProps<T>,
  next: TableRowProps<T>,
): boolean =>
  prev.isSelected === next.isSelected &&
  prev.item === next.item &&
  prev.onRowClick === next.onRowClick &&
  prev.dataIndex === next.dataIndex &&
  prev.style?.transform === next.style?.transform;

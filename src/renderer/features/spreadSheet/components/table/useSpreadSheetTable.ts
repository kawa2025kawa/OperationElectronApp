import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type {
  Column,
  SpreadSheetTableProps,
  TableRowProps,
} from "@shared/types/table/tableType";
import { getValueByPath } from "@shared/utils/getValueByPath";

const ROW_HEIGHT = 56;
const ROW_GAP = 12;
const ROW_SIZE = ROW_HEIGHT + ROW_GAP;

export interface HeaderGroupItem<T extends object> {
  label: string;
  width: string;
  cols: Column<T>[];
}

export interface GroupedColumnsResult<T extends object> {
  hasGroup: boolean;
  ungrouped: Column<T>[];
  groups: HeaderGroupItem<T>[];
}

/** 🎯 1. ヘッダーグループ計算ロジック */
export const useHeaderGroups = <T extends object>(
  columns: readonly Column<T>[],
): GroupedColumnsResult<T> => {
  return useMemo(() => {
    const hasGroup = columns.some((col) => col.headerGroup);
    if (!hasGroup) return { hasGroup: false, groups: [], ungrouped: [] };

    const map = new Map<string, HeaderGroupItem<T>>();
    const ungrouped: Column<T>[] = [];

    columns.forEach((col) => {
      if (col.headerGroup) {
        const { groupKey, label } = col.headerGroup;
        if (!map.has(groupKey)) {
          map.set(groupKey, { label, width: "0px", cols: [] });
        }
        map.get(groupKey)!.cols.push(col);
      } else {
        ungrouped.push(col);
      }
    });

    const groups = Array.from(map.values()).map((group) => {
      let isPercent = false;
      let totalNum = 0;

      group.cols.forEach((c) => {
        const wStr = String(c.width ?? "150px").trim();
        if (wStr.endsWith("%")) {
          isPercent = true;
          totalNum += parseFloat(wStr) || 0;
        } else {
          totalNum += parseFloat(wStr) || 150;
        }
      });

      return {
        ...group,
        width: isPercent ? `${totalNum}%` : `${totalNum}px`,
      };
    });

    return { hasGroup: true, ungrouped, groups };
  }, [columns]);
};

/** 🎯 2. セルの「公休」「年休」等ハイライト判定ロジック */
export const checkIsHolidayText = (value: unknown): boolean => {
  if (value == null || typeof value === "object") return false;
  const str = String(value);
  return (
    str.includes("公休") ||
    str.includes("年休") ||
    str.includes("休職") ||
    str.includes("〇連")
  );
};

/** 🎯 3. セルの値取得ヘルパー */
export const getCellValue = <T extends object>(
  item: T,
  col: Column<T>,
): { rawValue: unknown; strValue: string } => {
  const rawValue = col.render
    ? col.render(item)
    : getValueByPath(item as Record<string, unknown>, String(col.key));

  const strValue =
    rawValue != null && typeof rawValue !== "object" ? String(rawValue) : "";

  return { rawValue, strValue };
};

/** 🎯 4. 仮想化テーブルフック */
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

/** 🎯 5. React.memo 判定 */
export const areRowPropsEqual = <T extends object>(
  prev: TableRowProps<T>,
  next: TableRowProps<T>,
): boolean =>
  prev.isSelected === next.isSelected &&
  prev.item === next.item &&
  prev.onRowClick === next.onRowClick &&
  prev.dataIndex === next.dataIndex &&
  prev.style?.transform === next.style?.transform;

// src/renderer/hooks/useTableVirtualizer.ts

import { useLayoutEffect, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/** tokens.size.tableRowHeight (56px) + borderSpacing vertical (12px) */
const DEFAULT_ROW_ESTIMATE_PX = 68;

export type TableRowVirtualizer = ReturnType<
  typeof useVirtualizer<HTMLDivElement, Element>
>;

interface UseTableVirtualizerParams {
  readonly count: number;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly overscan?: number;
  readonly estimateSize?: number;
  readonly virtualizerRef?: RefObject<TableRowVirtualizer | null>;
}

export function useTableVirtualizer({
  count,
  containerRef,
  overscan = 4,
  estimateSize = DEFAULT_ROW_ESTIMATE_PX,
  virtualizerRef,
}: UseTableVirtualizerParams) {
  "use no memo";

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  useLayoutEffect(() => {
    if (virtualizerRef) {
      virtualizerRef.current = rowVirtualizer;
    }
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop =
    virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(
          0,
          totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0),
        )
      : 0;

  return {
    virtualItems,
    paddingTop,
    paddingBottom,
  };
}
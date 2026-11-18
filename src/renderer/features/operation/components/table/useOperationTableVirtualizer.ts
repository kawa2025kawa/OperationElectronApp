// src/renderer/features/operation/components/table/useOperationTableVirtualizer.ts

import type { RefObject } from "react";
import {
  useTableVirtualizer,
  type TableRowVirtualizer,
} from "@renderer/hooks/useTableVirtualizer";

export type OperationRowVirtualizer = TableRowVirtualizer;

interface UseOperationTableVirtualizerParams {
  readonly count: number;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly virtualizerRef: RefObject<OperationRowVirtualizer | null>;
}

export function useOperationTableVirtualizer({
  count,
  containerRef,
  virtualizerRef,
}: UseOperationTableVirtualizerParams) {
  "use no memo";

  return useTableVirtualizer({
    count,
    containerRef,
    overscan: 4,
    virtualizerRef,
  });
}
// src/shared/types/tableType.ts
import type { ReactNode } from "react";

type TableAlign = "left" | "center" | "right";

interface TableColumnMeta {
  width?: string | number;
  align?: TableAlign;
}

export interface Column<T = unknown> {
  key: keyof T | string;
  label: string;
  width?: string | number;
  align?: TableAlign;
  hidden?: boolean;
  truncate?: boolean;
  isNumber?: boolean;
  headerGroup?: {
    groupKey: string;
    label: string;
  };
  render?: (item: T) => ReactNode;
}

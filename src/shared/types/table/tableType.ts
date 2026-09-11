// src/shared/types/table/tableType.ts

import type { CSSProperties, ReactNode } from "react";

type TableAlign = "left" | "center" | "right";

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

/**
 * SpreadSheetTable 用の共通 Props
 */
export interface SpreadSheetTableProps<
  T extends object = Record<string, unknown>,
> {
  data: T[];
  columns: readonly Column<any>[];
  rowKey: keyof T | string;
  onRowClick?: (item: T) => void;
  selectedId?: string | number | null;
}

/**
 * TableRow 用の共通 Props
 */
export interface TableRowProps<T extends object = Record<string, unknown>> {
  item: T;
  columns: readonly Column<any>[];
  isSelected: boolean;
  onRowClick?: (item: T) => void;
  measureRef?: (element: HTMLElement | null) => void;
  dataIndex?: number;
  style?: CSSProperties;
}

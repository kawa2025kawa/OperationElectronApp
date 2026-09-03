// src/shared/types/spreadsheet/ui.ts
import type React from "react";
import type { Column } from "@shared/types/table";
import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

type SpreadSheetEntity = Shop | Kokyuhyo | Jugyoin | Tantou;

export interface SpreadSheetTableProps<T extends object = SpreadSheetEntity> {
  data: T[];
  columns: readonly Column<T>[];
  rowKey: keyof T;
  onRowClick?: (item: T) => void;
  selectedId?: string | number | null;
}

export interface TableRowProps<T extends object = SpreadSheetEntity> {
  item: T;
  columns: readonly Column<T>[];
  isSelected: boolean;
  onRowClick?: (item: T) => void;
  measureRef?: (element: HTMLElement | null) => void;
  dataIndex?: number;
  style?: React.CSSProperties;
}

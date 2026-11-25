// src/renderer/features/spreadSheet/components/table/useSpreadSheetTableHeader.ts

import type { ReactNode } from "react";
import type { Header, RowData } from "@tanstack/react-table";
import {
  getColumnAlign,
  type SpreadSheetTableFeatures,
} from "./spreadsheetTableConfig";
import type { SpreadSheetTableInstance } from "./useSpreadSheetTable";

type TableHeader<TData extends RowData> = Header<
  SpreadSheetTableFeatures,
  TData,
  unknown
>;

type GroupedHeaderCell<TData extends RowData> =
  | {
      readonly kind: "customPlaceholder";
      readonly id: string;
      readonly colSpan: number;
      readonly content: ReactNode;
    }
  | {
      readonly kind: "single";
      readonly id: string;
      readonly colSpan?: number;
      readonly align: "left" | "center" | "right";
      readonly header: TableHeader<TData>;
    }
  | {
      readonly kind: "group";
      readonly id: string;
      readonly colSpan: number;
      readonly hasGroupHeader: boolean;
      readonly header: TableHeader<TData>;
      readonly leaves: ReadonlyArray<{
        readonly id: string;
        readonly align: "left" | "center" | "right";
        readonly flex: string;
        readonly header: TableHeader<TData>;
      }>;
    };

export function useSpreadSheetTableHeader<TData extends RowData>(
  table: SpreadSheetTableInstance<TData>,
  placeholderColumnId?: string,
  placeholderContent?: ReactNode,
) {
  "use no memo";

  const headerGroups = table.getHeaderGroups();

  const groupedCells: GroupedHeaderCell<TData>[] = (
    headerGroups[0]?.headers ?? []
  ).map((header) => {
    const leafHeaders = header
      .getLeafHeaders()
      .filter((item) => item.column.columns.length === 0);

    if (header.isPlaceholder) {
      if (header.column.id === placeholderColumnId && placeholderContent) {
        return {
          kind: "customPlaceholder",
          id: header.id,
          colSpan: header.colSpan,
          content: placeholderContent,
        };
      }

      const target = leafHeaders[0] ?? header;
      return {
        kind: "single",
        id: header.id,
        colSpan: header.colSpan,
        align: getColumnAlign(target.column.columnDef.meta),
        header: target,
      };
    }

    if (leafHeaders.length > 1) {
      return {
        kind: "group",
        id: header.id,
        colSpan: header.colSpan,
        hasGroupHeader: Boolean(header.column.columnDef.header),
        header,
        leaves: leafHeaders.map((leafHeader) => ({
          id: leafHeader.id,
          align: getColumnAlign(leafHeader.column.columnDef.meta),
          flex: `${leafHeader.column.getSize()} 0 0`,
          header: leafHeader,
        })),
      };
    }

    return {
      kind: "single",
      id: header.id,
      align: getColumnAlign(header.column.columnDef.meta),
      header,
    };
  });

  const standardGroups = headerGroups.map((group) => ({
    id: group.id,
    headers: group.headers.map((header) => ({
      id: header.id,
      colSpan: header.isPlaceholder ? header.colSpan : undefined,
      isPlaceholder: header.isPlaceholder,
      align: getColumnAlign(header.column.columnDef.meta),
      header,
    })),
  }));

  return {
    groupedCells,
    standardGroups,
  };
}

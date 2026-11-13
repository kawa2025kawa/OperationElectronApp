// src/renderer/features/spreadSheet/components/table/spreadsheetTableConfig.ts

import { createElement } from "react";
import {
  createColumnHelper,
  createFilteredRowModel,
  globalFilteringFeature,
  stockFeatures,
  tableFeatures,
  type AccessorKeyColumnDef,
  type DeepKeys,
} from "@tanstack/react-table";
import * as tableStyles from "./spreadSheetTable.css";
import {
  formatDateWithDay,
  getOffsetDate,
} from "../../utils/spreadsheetDateUtils";

export const SPREADSHEET_TABLE_FEATURES = tableFeatures({
  ...stockFeatures,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
});

export type SpreadSheetTableFeatures = typeof SPREADSHEET_TABLE_FEATURES;

export interface SpreadSheetColumnMeta {
  readonly align?: "left" | "center" | "right";
}

export function getSpreadSheetCellText(value: unknown): string {
  return value == null || value === "" ? "-" : String(value);
}

export function renderSpreadSheetDateHeader(prefix: string, date: Date) {
  const { text, dayText, tone } = formatDateWithDay(date);
  const dayClass = tone === "weekday" ? undefined : tableStyles.dayTone[tone];

  return createElement(
    "span",
    null,
    `${prefix} ${text}`,
    createElement("span", { className: dayClass }, dayText),
  );
}

export interface ScheduleColumnsShape {
  todayAmStatus: string;
  todayAmDetail: string;
  todayPmStatus: string;
  todayPmDetail: string;
  tomorrowAmStatus: string;
  tomorrowAmDetail: string;
  tomorrowPmStatus: string;
  tomorrowPmDetail: string;
}

export function createScheduleDayGroups<TData extends ScheduleColumnsShape>(
  sizes: { readonly status: number; readonly detail: number },
  baseDate: Date = new Date(),
) {
  const helper = createColumnHelper<SpreadSheetTableFeatures, TData>();

  const days = [
    { id: "today", label: "本日", date: baseDate },
    { id: "tomorrow", label: "明日", date: getOffsetDate(1, baseDate) },
  ] as const;

  return days.map(({ id, label, date }) => {
    const subColumns: {
      key: DeepKeys<TData>;
      header: string;
      size: number;
    }[] = [
      {
        key: `${id}AmStatus` as DeepKeys<TData>,
        header: "区分",
        size: sizes.status,
      },
      {
        key: `${id}AmDetail` as DeepKeys<TData>,
        header: "午前",
        size: sizes.detail,
      },
      {
        key: `${id}PmStatus` as DeepKeys<TData>,
        header: "区分",
        size: sizes.status,
      },
      {
        key: `${id}PmDetail` as DeepKeys<TData>,
        header: "午後",
        size: sizes.detail,
      },
    ];

    return helper.group({
      id,
      header: () => renderSpreadSheetDateHeader(label, date),
      columns: subColumns.map(
        ({ key, header, size }) =>
          helper.accessor(key, {
            header,
            size,
          }) as AccessorKeyColumnDef<SpreadSheetTableFeatures, TData, unknown>,
      ),
    });
  });
}

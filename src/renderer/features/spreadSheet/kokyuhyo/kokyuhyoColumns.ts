// src/renderer/features/spreadSheet/kokyuhyo/kokyuhyoColumns.ts

import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Column } from "@shared/types/table/tableType";
import { DATE_LABELS } from "../utils/spreadsheetDateUtils";

export const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  { key: "name", label: "氏名", width: "20%" },
  {
    key: "todayAmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayAmDetail",
    label: "午前",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmDetail",
    label: "午後",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrowAmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowAmDetail",
    label: "午前",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmStatus",
    label: "区分",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmDetail",
    label: "午後",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
];

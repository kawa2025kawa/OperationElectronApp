// src/renderer/features/spreadSheet/jugyoin/jugyoinColumns.ts

import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Column } from "@shared/types/table/tableType";
import { DATE_LABELS } from "../utils/spreadsheetDateUtils";

export const JUGYOIN_COLUMNS: readonly Column<Jugyoin>[] = [
  { key: "bumon", label: "部門", width: "15%" },
  { key: "name", label: "氏名", width: "15%" },
  {
    key: "todayAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "todayPmDetail",
    label: "午後",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrowAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrowPmDetail",
    label: "午後",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
];

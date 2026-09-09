// src/renderer/features/spreadSheet/configs/jugyoinViewConfig.ts

import type { AppViewDefinition } from "@shared/types/registry";
import type { Jugyoin } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

export const JUGYOIN_COLUMNS: readonly Column<Jugyoin>[] = [
  { key: "bumon", label: "部署", width: "15%" },
  { key: "name", label: "氏名", width: "15%" },
  {
    key: "todayAmStatus",
    label: "AM1",
    width: "7%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayAmDetail",
    label: "AM1詳細",
    width: "10.5%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmStatus",
    label: "PM1",
    width: "7%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmDetail",
    label: "PM1詳細",
    width: "10.5%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "tomorrowAmStatus",
    label: "AM2",
    width: "7%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowAmDetail",
    label: "AM2詳細",
    width: "10.5%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmStatus",
    label: "PM2",
    width: "7%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmDetail",
    label: "PM2詳細",
    width: "10.5%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
] as const;

export const jugyoinViewConfig: AppViewDefinition<Jugyoin> = {
  id: APP_VIEW_IDS.JUGYOIN,
  title: "従業員情報",
  isProtected: true,
  sidebarMenu: {
    show: true,
    order: 3,
  },
  sheetId: "JugyoinMasterData",
  search: {
    placeholder: "部門、部門かな、名前、名前カナで検索...",
    searchKeys: ["bumon", "bumonKana", "name", "nameKana"],
  },
  modalConfig: {
    modalType: "sheet_jugyoin",
    modalSize: {
      width: "90vw",
      height: "85vh",
    },
  },
  columns: JUGYOIN_COLUMNS,
};

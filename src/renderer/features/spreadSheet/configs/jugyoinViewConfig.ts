// src/renderer/features/spreadSheet/configs/jugyoinViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Column } from "@shared/types/table/tableType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";

const DATE_LABELS = {
  today: `本日 (${formatDateForHeader(new Date())})`,
  tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1))})`,
} as const;

export const JUGYOIN_COLUMNS: readonly Column<Jugyoin>[] = [
  { key: "bumon", label: "部門", width: "15%" },
  { key: "name", label: "氏名", width: "15%" },

  // 本日グループ
  {
    key: "todayAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmDetail",
    label: "午後",
    width: "10.5%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },

  // 明日グループ
  {
    key: "tomorrowAmStatus",
    label: "区分",
    width: "7%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowAmDetail",
    label: "午前",
    width: "10.5%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmStatus",
    label: "区分",
    width: "7%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmDetail",
    label: "午後",
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
  component: null,
  isProtected: true,
  sidebarMenu: {
    show: true,
    order: 3,
  },
  sheetId: "JugyoinMasterData",
  search: {
    placeholder: "部門、名前で検索...",
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

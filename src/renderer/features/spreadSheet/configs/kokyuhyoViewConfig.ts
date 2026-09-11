// src/renderer/features/spreadSheet/configs/kokyuhyoViewConfig.ts

import type { AppViewDefinition } from "@shared/types/registry";
import type { Kokyuhyo } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table/tableType";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";

// 1段目に表示するグループラベル（「本日 (09/09水)」「明日 (09/10木)」）
const DATE_LABELS = {
  today: `本日 (${formatDateForHeader(new Date())})`,
  tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1))})`,
} as const;

export const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  {
    key: "name",
    label: "氏名",
    width: "20%",
  },
  // --------------------------------------------------------------------------
  // 本日グループ
  // --------------------------------------------------------------------------
  {
    key: "todayAmStatus",
    label: "AM",
    width: "8%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayAmDetail",
    label: "AM詳細",
    width: "12%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmStatus",
    label: "PM",
    width: "8%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmDetail",
    label: "PM詳細",
    width: "12%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  // --------------------------------------------------------------------------
  // 明日グループ
  // --------------------------------------------------------------------------
  {
    key: "tomorrowAmStatus",
    label: "AM",
    width: "8%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowAmDetail",
    label: "AM詳細",
    width: "12%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmStatus",
    label: "PM",
    width: "8%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmDetail",
    label: "PM詳細",
    width: "12%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
] as const;

export const kokyuhyoViewConfig: AppViewDefinition<Kokyuhyo> = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "公休表",
  component: null,
  isProtected: true,
  sidebarMenu: {
    show: true,
    order: 2,
  },
  sheetId: "KokyuhyoMasterData",
  search: {
    placeholder: "名前、名前カナで検索...",
    searchKeys: ["name", "nameKana"],
  },
  modalConfig: {
    modalType: "sheet_kokyuhyo",
    modalSize: {
      width: "90vw",
      height: "85vh",
    },
  },
  columns: KOKYUHYO_COLUMNS,
};

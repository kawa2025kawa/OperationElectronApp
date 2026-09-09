import type { AppViewDefinition } from "@shared/types/registry";
import type { Kokyuhyo } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

export const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  {
    key: "name",
    label: "氏名",
    width: "20%",
  },
  {
    key: "todayAmStatus",
    label: "AM1",
    width: "8%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayAmDetail",
    label: "AM1詳細",
    width: "12%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmStatus",
    label: "PM1",
    width: "8%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "todayPmDetail",
    label: "PM1詳細",
    width: "12%",
    headerGroup: {
      groupKey: "today",
      label: DATE_LABELS.today,
    },
  },
  {
    key: "tomorrowAmStatus",
    label: "AM2",
    width: "8%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowAmDetail",
    label: "AM2詳細",
    width: "12%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmStatus",
    label: "PM2",
    width: "8%",
    headerGroup: {
      groupKey: "tomorrow",
      label: DATE_LABELS.tomorrow,
    },
  },
  {
    key: "tomorrowPmDetail",
    label: "PM2詳細",
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

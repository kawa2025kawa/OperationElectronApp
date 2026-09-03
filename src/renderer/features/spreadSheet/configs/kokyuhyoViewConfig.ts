import type { AppViewDefinition } from "@shared/types/registry";
import { SHEET_IDS, type Kokyuhyo } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

export const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  { key: "name", label: "氏名", width: "20%" },
  {
    key: "today.amStatus",
    label: "AM1",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.amDetail",
    label: "AM1詳細",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmStatus",
    label: "PM1",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmDetail",
    label: "PM1詳細",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrow.amStatus",
    label: "AM2",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.amDetail",
    label: "AM2詳細",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmStatus",
    label: "PM2",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmDetail",
    label: "PM2詳細",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
] as const;

export const kokyuhyoViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "公休表",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 2 },
  sheetId: SHEET_IDS.KOKYUHYO,
  search: {
    placeholder: "検索...",
    searchKeys: ["name", "naisen", "contactMobile"],
  },
  modalConfig: {
    modalType: "sheet_kokyuhyo",
    modalSize: { width: "90vw", height: "85vh" },
  },
  columns: KOKYUHYO_COLUMNS as readonly Column<unknown>[],
};

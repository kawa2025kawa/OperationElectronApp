// src/renderer/features/spreadSheet/components/modal/kokyuhyo/useKokyuhyoModalContent.ts
import { useCallback } from "react";
import { addDays } from "date-fns";
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import type { Column } from "@shared/types/tableType";
import { commands } from "@shared/service/commands";
import { SHEET_IDS, type Kokyuhyo } from "@shared/types/spreadsheetTypes";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
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
  title: "Kokyuhyo",
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

export function useKokyuhyoModalContent(data: Kokyuhyo) {
  const scheduleLink =
    data?.scheduleLink !== "-" ? data?.scheduleLink : undefined;
  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) void commands.openExternal(scheduleLink);
  }, [scheduleLink]);

  return {
    contact: {
      extension: data.contact?.extension ?? "-",
      mobileShort: data.contact?.mobileShort ?? "-",
      mobile: data.contact?.mobile ?? "-",
    },
    scheduleLink,
    schedules: [
      {
        label: "本日",
        date: formatDateWithDay(new Date()),
        schedule: data.today,
      },
      {
        label: "明日",
        date: formatDateWithDay(addDays(new Date(), 1)),
        schedule: data.tomorrow,
      },
    ],
    handleOpenSchedule,
  };
}

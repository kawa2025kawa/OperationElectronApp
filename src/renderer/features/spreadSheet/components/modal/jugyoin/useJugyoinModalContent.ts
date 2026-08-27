// src/renderer/features/spreadSheet/components/modal/jugyoin/useJugyoinModalContent.ts
import { useCallback } from "react";
import { addDays } from "date-fns";
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import type { Column } from "@shared/types/tableType";
import { commands } from "@shared/service/commands";
import { SHEET_IDS, type Jugyoin } from "@shared/types/spreadsheetTypes";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

const JUGYOIN_COLUMNS: readonly Column<Jugyoin>[] = [
  { key: "department", label: "部署", width: "15%" },
  { key: "name", label: "氏名", width: "15%" },
  {
    key: "today.amStatus",
    label: "AM1",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.amDetail",
    label: "AM1詳細",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmStatus",
    label: "PM1",
    width: "7%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmDetail",
    label: "PM1詳細",
    width: "10.5%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrow.amStatus",
    label: "AM2",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.amDetail",
    label: "AM2詳細",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmStatus",
    label: "PM2",
    width: "7%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmDetail",
    label: "PM2詳細",
    width: "10.5%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
] as const;

export const jugyoinViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.JUGYOIN,
  title: "Jugyoin",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 3 },
  sheetId: SHEET_IDS.JUGYOIN,
  search: {
    placeholder: "検索...",
    searchKeys: ["name", "bumon", "naisen", "contactMobile"],
  },
  modalConfig: {
    modalType: "sheet_jugyoin",
    modalSize: { width: "90vw", height: "85vh" },
  },
  columns: JUGYOIN_COLUMNS as readonly Column<unknown>[],
};

export function useJugyoinModalContent(data: Jugyoin) {
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

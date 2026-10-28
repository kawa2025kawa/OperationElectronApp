// src/renderer/features/spreadSheet/jugyoin/modal/useJugyoinModalContent.ts

import { useCallback } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { systemIpcService } from "@renderer/services/systemIpcService";
import {
  formatDateWithDay,
  getOffsetDate,
} from "../../utils/spreadsheetDateUtils";

export function useJugyoinModalContent(data: Jugyoin) {
  const scheduleLink =
    data?.scheduleLink && data.scheduleLink !== "-"
      ? data.scheduleLink
      : undefined;

  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) {
      void systemIpcService.openExternal(scheduleLink);
    }
  }, [scheduleLink]);

  const profile = {
    position: data?.position || "-",
    email: data?.email || "-",
    extension: data?.naisen || "-",
    mobileShort: data?.tanshuku || "-",
    mobile: data?.contactMobile || "-",
  };

  const now = new Date();

  const schedules = [
    {
      label: "本日",
      date: formatDateWithDay(now),
      amStatus: data?.todayAmStatus || "-",
      amDetail: data?.todayAmDetail || "-",
      pmStatus: data?.todayPmStatus || "-",
      pmDetail: data?.todayPmDetail || "-",
    },
    {
      label: "明日",
      date: formatDateWithDay(getOffsetDate(1, now)),
      amStatus: data?.tomorrowAmStatus || "-",
      amDetail: data?.tomorrowAmDetail || "-",
      pmStatus: data?.tomorrowPmStatus || "-",
      pmDetail: data?.tomorrowPmDetail || "-",
    },
  ];

  return {
    state: {
      profile,
      schedules,
      hasScheduleLink: Boolean(scheduleLink),
    },
    actions: {
      handleOpenSchedule,
    },
  };
}

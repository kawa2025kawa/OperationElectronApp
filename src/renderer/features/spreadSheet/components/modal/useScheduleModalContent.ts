// src/renderer/features/spreadSheet/components/modal/useScheduleModalContent.ts

import { useCallback } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import { EMPTY_VALUE_FALLBACK } from "@shared/types/spreadsheet/spreadsheetTypes";
import { systemIpcService } from "@renderer/services/systemIpcService";
import {
  formatDateWithDay,
  getOffsetDate,
} from "../../utils/spreadsheetDateUtils";

export type ScheduleModalTarget = Jugyoin | Kokyuhyo;

export function useScheduleModalContent(data: ScheduleModalTarget) {
  const scheduleLink =
    data?.scheduleLink && data.scheduleLink !== EMPTY_VALUE_FALLBACK
      ? data.scheduleLink
      : undefined;

  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) {
      void systemIpcService.openExternal(scheduleLink);
    }
  }, [scheduleLink]);

  const profile = {
    position: data?.position || EMPTY_VALUE_FALLBACK,
    email: data?.email || EMPTY_VALUE_FALLBACK,
    extension: data?.naisen || EMPTY_VALUE_FALLBACK,
    mobileShort: data?.tanshuku || EMPTY_VALUE_FALLBACK,
    mobile: data?.contactMobile || EMPTY_VALUE_FALLBACK,
  };

  const now = new Date();

  const schedules = [
    {
      label: "本日",
      date: formatDateWithDay(now),
      amStatus: data?.todayAmStatus || EMPTY_VALUE_FALLBACK,
      amDetail: data?.todayAmDetail || EMPTY_VALUE_FALLBACK,
      pmStatus: data?.todayPmStatus || EMPTY_VALUE_FALLBACK,
      pmDetail: data?.todayPmDetail || EMPTY_VALUE_FALLBACK,
    },
    {
      label: "明日",
      date: formatDateWithDay(getOffsetDate(1, now)),
      amStatus: data?.tomorrowAmStatus || EMPTY_VALUE_FALLBACK,
      amDetail: data?.tomorrowAmDetail || EMPTY_VALUE_FALLBACK,
      pmStatus: data?.tomorrowPmStatus || EMPTY_VALUE_FALLBACK,
      pmDetail: data?.tomorrowPmDetail || EMPTY_VALUE_FALLBACK,
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

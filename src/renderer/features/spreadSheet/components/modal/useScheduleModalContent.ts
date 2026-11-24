// src/renderer/features/spreadSheet/components/modal/useScheduleModalContent.ts

import { useCallback, useMemo } from "react";
import {
  SHEETS,
  type PublicJugyoin,
  type PublicKokyuhyo,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";
import { spreadSheetService } from "../../service/spreadSheetService";
import {
  formatDateWithDay,
  getOffsetDate,
} from "../../utils/spreadsheetDateUtils";

export type ScheduleModalTarget = PublicJugyoin | PublicKokyuhyo;

export function useScheduleModalContent(data: ScheduleModalTarget) {
  const hasScheduleLink = Boolean(data?.hasScheduleLink && data?.id);

  const handleOpenSchedule = useCallback(() => {
    if (!hasScheduleLink || !data?.id) return;

    const sheetId =
      "bumon" in data ? SHEETS.JUGYOIN.sheetName : SHEETS.KOKYUHYO.sheetName;

    void spreadSheetService.openStaffSchedule(sheetId, data.id);
  }, [hasScheduleLink, data]);

  const profile = useMemo(
    () => ({
      position: data?.position || EMPTY_VALUE_FALLBACK,
      email: data?.email || EMPTY_VALUE_FALLBACK,
      extension: data?.naisen || EMPTY_VALUE_FALLBACK,
      mobileShort: data?.tanshuku || EMPTY_VALUE_FALLBACK,
      mobile: data?.contactMobile || EMPTY_VALUE_FALLBACK,
    }),
    [
      data?.position,
      data?.email,
      data?.naisen,
      data?.tanshuku,
      data?.contactMobile,
    ],
  );

  const schedules = useMemo(() => {
    const now = new Date();

    return [
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
  }, [
    data?.todayAmStatus,
    data?.todayAmDetail,
    data?.todayPmStatus,
    data?.todayPmDetail,
    data?.tomorrowAmStatus,
    data?.tomorrowAmDetail,
    data?.tomorrowPmStatus,
    data?.tomorrowPmDetail,
  ]);

  return {
    state: {
      profile,
      schedules,
      hasScheduleLink,
    },
    actions: {
      handleOpenSchedule,
    },
  };
}
// src/renderer/features/spreadSheet/components/modal/useScheduleModalContent.ts

import { useCallback, useMemo } from "react";
import { useAppStore } from "@renderer/store";
import { EMPTY_VALUE_FALLBACK } from "@renderer/utils/rendererUtils";
import {
  SHEETS,
  type PublicJugyoin,
  type PublicKokyuhyo,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { spreadSheetService } from "../../service/spreadSheetService";
import {
  formatDateWithDay,
  getOffsetDate,
  resolveScheduleBaseDate,
} from "../../utils/spreadsheetDateUtils";

export type ScheduleModalTarget = PublicJugyoin | PublicKokyuhyo;

const SCHEDULE_DAY_DEFINITIONS = [
  { prefix: "today", label: "本日", offsetDays: 0 },
  { prefix: "tomorrow", label: "明日", offsetDays: 1 },
] as const;

export function useScheduleModalContent(data: ScheduleModalTarget) {
  const isJugyoin = "bumon" in data;
  const updatedAt = useAppStore((state) =>
    isJugyoin
      ? state.dailyUpdateStatus?.jugyoinUpdatedAt
      : state.dailyUpdateStatus?.kokyuhyoUpdatedAt,
  );

  const hasScheduleLink = Boolean(data?.hasScheduleLink && data?.id);

  const handleOpenSchedule = useCallback(() => {
    if (!hasScheduleLink || !data?.id) return;

    const sheetId = isJugyoin
      ? SHEETS.JUGYOIN.sheetName
      : SHEETS.KOKYUHYO.sheetName;

    void spreadSheetService.openStaffSchedule(sheetId, data.id);
  }, [hasScheduleLink, data?.id, isJugyoin]);

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
    const baseDate = resolveScheduleBaseDate(updatedAt);

    return SCHEDULE_DAY_DEFINITIONS.map(({ prefix, label, offsetDays }) => ({
      label,
      date: formatDateWithDay(getOffsetDate(offsetDays, baseDate)),
      amStatus: data?.[`${prefix}AmStatus`] || EMPTY_VALUE_FALLBACK,
      amDetail: data?.[`${prefix}AmDetail`] || EMPTY_VALUE_FALLBACK,
      pmStatus: data?.[`${prefix}PmStatus`] || EMPTY_VALUE_FALLBACK,
      pmDetail: data?.[`${prefix}PmDetail`] || EMPTY_VALUE_FALLBACK,
    }));
  }, [updatedAt, data]);

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
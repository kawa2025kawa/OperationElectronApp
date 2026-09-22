import { useCallback, useMemo } from "react";
import { addDays } from "date-fns";
import { commands } from "@renderer/services/commands";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";

export function useJugyoinModalContent(data: Jugyoin) {
  const scheduleLink = useMemo(() => {
    return data?.scheduleLink && data.scheduleLink !== "-"
      ? data.scheduleLink
      : undefined;
  }, [data?.scheduleLink]);

  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) {
      void commands.openExternal(scheduleLink);
    }
  }, [scheduleLink]);

  const profile = useMemo(
    () => ({
      position: data?.position || "-",
      email: data?.email || "-",
      extension: data?.naisen || "-",
      mobileShort: data?.tanshuku || "-",
      mobile: data?.contactMobile || "-",
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
        amStatus: data?.todayAmStatus || "-",
        amDetail: data?.todayAmDetail || "-",
        pmStatus: data?.todayPmStatus || "-",
        pmDetail: data?.todayPmDetail || "-",
      },
      {
        label: "明日",
        date: formatDateWithDay(addDays(now, 1)),
        amStatus: data?.tomorrowAmStatus || "-",
        amDetail: data?.tomorrowAmDetail || "-",
        pmStatus: data?.tomorrowPmStatus || "-",
        pmDetail: data?.tomorrowPmDetail || "-",
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
      hasScheduleLink: Boolean(scheduleLink),
    },
    actions: {
      handleOpenSchedule,
    },
  };
}

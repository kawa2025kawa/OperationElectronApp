//src\renderer\features\spreadSheet\kokyuhyo\modal\useKokyuhyoModalContent.ts

import { useCallback, useMemo } from "react";
import { addDays, format, getDay } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { systemCommands } from "@renderer/services/commands";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";

const formatDateWithDay = (date: Date) => {
  const mmdd = format(date, "MM/dd");
  const dayOfWeek = format(date, "EEE", { locale: ja });
  const dayNum = getDay(date);

  let dayColor = "inherit";

  if (dayNum === 6) dayColor = "#0077ff";
  if (dayNum === 0) dayColor = "#ff3333";

  return {
    text: mmdd,
    dayText: `(${dayOfWeek})`,
    dayStyle: { color: dayColor },
  };
};

export function useKokyuhyoModalContent(data: Kokyuhyo) {
  const scheduleLink = useMemo(() => {
    return data?.scheduleLink && data.scheduleLink !== "-"
      ? data.scheduleLink
      : undefined;
  }, [data?.scheduleLink]);

  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) {
      void systemCommands.openExternal(scheduleLink);
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

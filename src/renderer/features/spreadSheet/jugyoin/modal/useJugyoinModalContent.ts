import { useCallback } from "react";
import { addDays, format, getDay } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { systemCommands } from "@renderer/services/commands";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";

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

export function useJugyoinModalContent(data: Jugyoin) {
  const scheduleLink =
    data?.scheduleLink && data.scheduleLink !== "-"
      ? data.scheduleLink
      : undefined;

  const handleOpenSchedule = useCallback(() => {
    if (scheduleLink) {
      void systemCommands.openExternal(scheduleLink);
    }
  }, [scheduleLink]);

  const profile = {
    position: data?.position || "-",
    email: data?.email || "-",
    extension: data?.naisen || "-",
    mobileShort: data?.tanshuku || "-",
    mobile: data?.contactMobile || "-",
  };

  const schedules = [
    {
      label: "本日",
      date: formatDateWithDay(new Date()),
      amStatus: data?.todayAmStatus || "-",
      amDetail: data?.todayAmDetail || "-",
      pmStatus: data?.todayPmStatus || "-",
      pmDetail: data?.todayPmDetail || "-",
    },
    {
      label: "明日",
      date: formatDateWithDay(addDays(new Date(), 1)),
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

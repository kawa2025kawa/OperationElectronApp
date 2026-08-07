// src/renderer/features/spreadSheet/components/modal/contents/common/scheduleUtils.ts
import { format, getDay } from "date-fns";
import { ja } from "date-fns/locale";

export const formatDateWithDay = (date: Date) => {
  const mmdd = format(date, "MM/dd");
  const dayOfWeek = format(date, "EEE", { locale: ja });
  const dayNum = getDay(date);

  let dayColor = "inherit";
  if (dayNum === 6) dayColor = "#0077ff"; // 土曜日
  if (dayNum === 0) dayColor = "#ff3333"; // 日曜日

  return {
    text: mmdd,
    dayText: `(${dayOfWeek})`,
    dayStyle: { color: dayColor },
  };
};

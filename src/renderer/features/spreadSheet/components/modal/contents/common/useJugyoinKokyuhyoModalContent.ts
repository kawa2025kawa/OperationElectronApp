import { useMemo } from "react";
import { addDays } from "date-fns";
import type { Jugyoin } from "../../../../types/spreadsheetTypes";
import { formatDateWithDay } from "./scheduleUtils";

export function useJugyoinModalLogic(data: Jugyoin) {
  const scheduleLink =
    data?.scheduleLink !== "-" ? data?.scheduleLink : undefined;
  const todayFormatted = useMemo(() => formatDateWithDay(new Date()), []);
  const tomorrowFormatted = useMemo(
    () => formatDateWithDay(addDays(new Date(), 1)),
    [],
  );

  return { scheduleLink, todayFormatted, tomorrowFormatted };
}

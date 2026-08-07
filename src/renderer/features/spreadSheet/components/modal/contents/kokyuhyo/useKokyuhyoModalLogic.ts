// src/renderer/features/spreadSheet/components/modal/contents/kokyuhyo/useKokyuhyoModalLogic.ts
import { useMemo } from "react";
import { addDays } from "date-fns";
import type { Kokyuhyo } from "@shared/types/spreadsheetTypes";
import { formatDateWithDay } from "../common/scheduleUtils";

export function useKokyuhyoModalLogic(data: Kokyuhyo) {
  const scheduleLink =
    data?.scheduleLink !== "-" ? data?.scheduleLink : undefined;
  const todayFormatted = useMemo(() => formatDateWithDay(new Date()), []);
  const tomorrowFormatted = useMemo(
    () => formatDateWithDay(addDays(new Date(), 1)),
    [],
  );

  return { scheduleLink, todayFormatted, tomorrowFormatted };
}

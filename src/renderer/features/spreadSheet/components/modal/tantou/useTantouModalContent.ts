import { useMemo } from "react";
import { addDays } from "date-fns";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { formatDateForHeader } from "@shared/utils/dateUtils";
import {
  type TabGroupConfig,
  useSpreadSheetTabData,
} from "../hooks/useSpreadSheetTabData";

const TANTOU_FIELDS = [
  { key: "Hayaban", label: "早番" },
  { key: "Shikai", label: "司会" },
  { key: "Uketsuke", label: "受付" },
  { key: "Denwa", label: "電話" },
  { key: "Nimotsu", label: "荷物" },
  { key: "2F", label: "2F" },
  { key: "3F", label: "3F" },
  { key: "Tensou", label: "転送" },
  { key: "AmAttendanceRate", label: "AM出勤率" },
  { key: "PmAttendanceRate", label: "PM出勤率" },
] as const;

const createTantouGroup = (
  prefix: "today" | "tomorrow",
  title: string,
): TabGroupConfig => ({
  title,
  items: TANTOU_FIELDS.map(({ key, label }) => ({
    key: `${prefix}${key}`,
    label,
  })),
});

const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  createTantouGroup("today", "本日"),
  createTantouGroup("tomorrow", "明日"),
] as const;

export function useTantouModalContent(data: Tantou) {
  const { selectedIndex, setSelectedIndex, displayItems } =
    useSpreadSheetTabData(data, TANTOU_MODAL_GROUPS);

  const { todayLabel, tomorrowLabel } = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    return {
      todayLabel: `本日 ${formatDateForHeader(now)}`,
      tomorrowLabel: `明日 ${formatDateForHeader(tomorrow)}`,
    };
  }, []);

  return {
    state: {
      selectedIndex,
      displayItems,
      todayLabel,
      tomorrowLabel,
    },
    actions: {
      setSelectedIndex,
    },
  };
}

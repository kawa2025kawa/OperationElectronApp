// src/renderer/features/spreadSheet/tantou/modal/useTantouDetailContent.ts

import { useMemo } from "react";
import { useAppStore, type AppState } from "@renderer/store";
import type { Tantou } from "@shared/types/spreadsheet/spreadsheetTypes";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  formatDateForHeader,
  getOffsetDate,
  resolveScheduleBaseDate,
} from "../../utils/spreadsheetDateUtils";

const TANTOU_DETAIL_FIELDS = [
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

const createDetailGroup = (prefix: "today" | "tomorrow", title: string) => ({
  title,
  items: TANTOU_DETAIL_FIELDS.map(({ key, label }) => ({
    key: `${prefix}${key}`,
    label,
  })),
});

const TANTOU_DETAIL_GROUPS = [
  createDetailGroup("today", "本日"),
  createDetailGroup("tomorrow", "明日"),
] as const;

export function useTantouDetailContent(data: Tantou) {
  const { selectedIndex, setSelectedIndex, displayItems } =
    useSpreadSheetTabData(data, TANTOU_DETAIL_GROUPS);

  const kokyuhyoUpdatedAt = useAppStore(
    (state: AppState) => state.dailyUpdateStatus?.kokyuhyoUpdatedAt,
  );

  const tabs = useMemo(() => {
    const baseDate = resolveScheduleBaseDate(kokyuhyoUpdatedAt);
    return [
      { id: 0, label: `本日 ${formatDateForHeader(baseDate)}` },
      {
        id: 1,
        label: `明日 ${formatDateForHeader(getOffsetDate(1, baseDate))}`,
      },
    ];
  }, [kokyuhyoUpdatedAt]);

  return {
    selectedIndex,
    setSelectedIndex,
    tabs,
    displayItems,
  };
}
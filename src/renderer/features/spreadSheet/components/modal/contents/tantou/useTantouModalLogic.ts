// src/renderer/features/spreadSheet/components/modal/contents/tantou/useTantouModalLogic.ts
import { useState, useMemo } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { Tantou } from "@shared/types/spreadsheetTypes";

export const TANTOU_MODAL_GROUPS = [
  { title: "本日", period: "today" },
  { title: "明日", period: "tomorrow" },
] as const;

export const TANTOU_LABEL_MAP: Record<string, string> = {
  hayaban: "早番",
  shikai: "司会",
  uketsuke: "受付",
  denwa: "電話",
  nimotsu: "荷物",
  "2F": "2Fフロア",
  "3F": "3Fフロア",
  tensou: "転送",
  amAttendanceRate: "AM出勤",
  pmAttendanceRate: "PM出勤",
};

export function useTantouModalLogic(data: Tantou) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayItems = useMemo(() => {
    if (!data) return [];
    const currentPeriod = TANTOU_MODAL_GROUPS[selectedIndex].period;
    return Object.entries(TANTOU_LABEL_MAP).map(([fieldName, label]) => {
      const targetPath = `${currentPeriod}.${fieldName}`;
      const rawVal = getValueByPath(
        data as unknown as Record<string, unknown>,
        targetPath,
      );
      return {
        label,
        value:
          rawVal !== "" && rawVal !== null && rawVal !== undefined
            ? rawVal
            : "-",
      };
    });
  }, [data, selectedIndex]);

  return useMemo(
    () => ({
      groups: TANTOU_MODAL_GROUPS,
      selectedIndex,
      setSelectedIndex,
      displayItems,
    }),
    [selectedIndex, displayItems],
  );
}

// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.tsx

import React, { useMemo } from "react";
import { addDays } from "date-fns";
import { type Tantou } from "@shared/types/spreadsheet";
import { formatDateForHeader } from "@shared/utils/dateUtils";
import {
  type TabGroupConfig,
  useSpreadSheetTabData,
} from "../hooks/useSpreadSheetTabData";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "./TantouModalContent.css";

const TANTOU_FIELDS = [
  { key: "hayaban", label: "早番" },
  { key: "shikai", label: "司会" },
  { key: "uketsuke", label: "受付" },
  { key: "denwa", label: "電話" },
  { key: "nimotsu", label: "荷物" },
  { key: "2F", label: "2F" },
  { key: "3F", label: "3F" },
  { key: "tensou", label: "転送" },
  { key: "amAttendanceRate", label: "AM出勤率" },
  { key: "pmAttendanceRate", label: "PM出勤率" },
] as const;

const createTantouGroup = (
  prefix: "today" | "tomorrow",
  title: string,
): TabGroupConfig => ({
  title,
  items: TANTOU_FIELDS.map(({ key, label }) => ({
    key: `${prefix}.${key}`,
    label,
  })),
});

const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  createTantouGroup("today", "本日"),
  createTantouGroup("tomorrow", "明日"),
] as const;

export const TantouModalContent: React.FC<SpreadSheetModalProps<Tantou>> =
  React.memo(({ data }) => {
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

    return (
      <div className={styles.mainContainer}>
        {/* Tab List */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={styles.button}
            data-variant="tab"
            data-active={selectedIndex === 0}
            onClick={() => setSelectedIndex(0)}
          >
            {todayLabel}
          </button>
          <button
            type="button"
            className={styles.button}
            data-variant="tab"
            data-active={selectedIndex === 1}
            onClick={() => setSelectedIndex(1)}
          >
            {tomorrowLabel}
          </button>
        </div>

        {/* Card Grid Content */}
        <div className={styles.contentContainer}>
          <div className={styles.gridContainer}>
            {displayItems.map((item) => (
              <div key={item.label} className={styles.card}>
                <div className={styles.label}>{item.label}</div>
                <div className={styles.value}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

TantouModalContent.displayName = "TantouModalContent";

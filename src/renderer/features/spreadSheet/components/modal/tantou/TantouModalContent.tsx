// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.tsx
import React, { useMemo } from "react";
import type { Tantou } from "@shared/types/spreadsheetTypes";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "./TantouModalContent.css";
import { useTantouModalContent } from "./useTantouModalContent";

const formatDateWithDay = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = weekDays[date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
};

export const TantouModalContent: React.FC<SpreadSheetModalProps<Tantou>> =
  React.memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, displayItems } =
      useTantouModalContent(data);

    const { todayLabel, tomorrowLabel } = useMemo(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return {
        todayLabel: `本日 ${formatDateWithDay(now)}`,
        tomorrowLabel: `明日 ${formatDateWithDay(tomorrow)}`,
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

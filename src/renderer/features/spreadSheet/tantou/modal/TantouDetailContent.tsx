// src/renderer/features/spreadSheet/tantou/modal/TantouDetailContent.tsx

import { memo } from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  formatDateForHeader,
  getOffsetDate,
} from "../../utils/spreadsheetDateUtils";
import * as styles from "./tantouDetailContent.css";

export interface TantouDetailContentProps {
  data: Tantou;
}

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

export const TantouDetailContent: GlobalModalComponent<TantouDetailContentProps> =
  memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, displayItems } =
      useSpreadSheetTabData(data, TANTOU_DETAIL_GROUPS);

    const now = new Date();
    const todayLabel = `本日 ${formatDateForHeader(now)}`;
    const tomorrowLabel = `明日 ${formatDateForHeader(getOffsetDate(1, now))}`;

    return (
      <div className={styles.container}>
        <div className={styles.tabBar}>
          <button
            type="button"
            className={styles.tabButton}
            data-active={selectedIndex === 0}
            onClick={() => setSelectedIndex(0)}
          >
            {todayLabel}
          </button>
          <button
            type="button"
            className={styles.tabButton}
            data-active={selectedIndex === 1}
            onClick={() => setSelectedIndex(1)}
          >
            {tomorrowLabel}
          </button>
        </div>

        <div className={styles.listContainer}>
          <div className={styles.detailList}>
            {displayItems.map(({ label, value }) => (
              <div key={label} className={styles.detailRow}>
                <div className={styles.fieldLabel}>{label}</div>
                <div className={styles.fieldValueContainer}>
                  <div className={styles.fieldValue}>{value || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

TantouDetailContent.displayName = "TantouDetailContent";

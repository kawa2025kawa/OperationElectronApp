// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.tsx

import React, { useMemo } from "react";
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheetTypes";
import type { Column } from "@shared/types/tableType";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import {
  type TabGroupConfig,
  useSpreadSheetTabData,
} from "../hooks/useSpreadSheetTabData";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "./TantouModalContent.css";

const TANTOU_COLUMNS: readonly Column<Tantou>[] = [
  { key: "today.hayaban", label: "早番", width: "10.5%" },
  { key: "today.shikai", label: "司会", width: "10.5%" },
  { key: "today.uketsuke", label: "受付", width: "10.5%" },
  { key: "today.denwa", label: "電話", width: "10.5%" },
  { key: "today.nimotsu", label: "荷物", width: "10.5%" },
  { key: "today.floor2f", label: "2F", width: "8.5%" },
  { key: "today.floor3f", label: "3F", width: "8.5%" },
  { key: "today.tensou", label: "転送", width: "10.5%" },
  { key: "today.amAttendance", label: "AM出勤率", width: "10%" },
  { key: "today.pmAttendance", label: "PM出勤率", width: "10%" },
] as const;

export const tantouViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.TANTOU,
  title: "Tantou",
  component: null,
  isProtected: true,
  sidebarMenu: { show: false, order: 99 },
  sheetId: SHEET_IDS.TANTOU,
  search: {
    placeholder: "検索...",
    searchKeys: [
      "today.hayaban",
      "today.shikai",
      "today.uketsuke",
      "today.denwa",
      "today.nimotsu",
      "today.floor2f",
      "today.floor3f",
      "today.tensou",
    ],
  },
  modalConfig: {
    modalType: "sheet_tantou",
    modalSize: { width: "70vw", height: "70vh" },
  },
  columns: TANTOU_COLUMNS as readonly Column<unknown>[],
};

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
      useSpreadSheetTabData(
        data as unknown as Record<string, unknown>,
        TANTOU_MODAL_GROUPS,
      );

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

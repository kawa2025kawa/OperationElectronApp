// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.tsx

import React, { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { commands } from "@shared/service/commands";
import { SHEET_IDS, type Kokyuhyo } from "@shared/types/spreadsheetTypes";
import type { Column } from "@shared/types/tableType";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";
import type { SpreadSheetModalProps } from "../modalRegistry";
import { useSpreadSheetModalContext } from "../SpreadSheetModalContext";
import * as styles from "./KokyuhyoModalContent.css";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

const KOKYUHYO_COLUMNS: readonly Column<Kokyuhyo>[] = [
  { key: "name", label: "氏名", width: "20%" },
  {
    key: "today.amStatus",
    label: "AM1",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.amDetail",
    label: "AM1詳細",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmStatus",
    label: "PM1",
    width: "8%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "today.pmDetail",
    label: "PM1詳細",
    width: "12%",
    headerGroup: { groupKey: "today", label: DATE_LABELS.today },
  },
  {
    key: "tomorrow.amStatus",
    label: "AM2",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.amDetail",
    label: "AM2詳細",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmStatus",
    label: "PM2",
    width: "8%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
  {
    key: "tomorrow.pmDetail",
    label: "PM2詳細",
    width: "12%",
    headerGroup: { groupKey: "tomorrow", label: DATE_LABELS.tomorrow },
  },
] as const;

export const kokyuhyoViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "Kokyuhyo",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 2 },
  sheetId: SHEET_IDS.KOKYUHYO,
  search: {
    placeholder: "検索...",
    searchKeys: ["name", "naisen", "contactMobile"],
  },
  modalConfig: {
    modalType: "sheet_kokyuhyo",
    modalSize: { width: "90vw", height: "85vh" },
  },
  columns: KOKYUHYO_COLUMNS as readonly Column<unknown>[],
};

export const KokyuhyoModalContent: React.FC<SpreadSheetModalProps<Kokyuhyo>> =
  React.memo(({ data }) => {
    const { setHeaderRight } = useSpreadSheetModalContext();

    const scheduleLink =
      data?.scheduleLink !== "-" ? data?.scheduleLink : undefined;
    const handleOpenSchedule = useCallback(() => {
      if (scheduleLink) void commands.openExternal(scheduleLink);
    }, [scheduleLink]);

    const contact = {
      extension: data.contact?.extension ?? "-",
      mobileShort: data.contact?.mobileShort ?? "-",
      mobile: data.contact?.mobile ?? "-",
    };

    const schedules = [
      {
        label: "本日",
        date: formatDateWithDay(new Date()),
        schedule: data.today,
      },
      {
        label: "明日",
        date: formatDateWithDay(addDays(new Date(), 1)),
        schedule: data.tomorrow,
      },
    ];

    useEffect(() => {
      setHeaderRight(
        <>
          <div className={styles.textGroup}>
            <span>内線 : {contact.extension}</span>
            <span>PHS : {contact.mobileShort}</span>
            <span>携帯 : {contact.mobile}</span>
          </div>
          {scheduleLink && (
            <button
              type="button"
              className={styles.button}
              data-variant="pill"
              onClick={handleOpenSchedule}
            >
              スケジュール
            </button>
          )}
        </>,
      );
      return () => setHeaderRight(null);
    }, [contact, scheduleLink, handleOpenSchedule, setHeaderRight]);

    return (
      <div className={styles.contentContainer}>
        {schedules.map((item) => (
          <div key={item.label} className={styles.tableGrid}>
            <div className={styles.cell.date}>
              <div className={styles.value}>{item.label}</div>
              <div className={styles.label}>
                {item.date.text}
                <span style={item.date.dayStyle}>{item.date.dayText}</span>
              </div>
            </div>
            <div className={styles.cell.header}>区分</div>
            <div className={styles.cell.header}>状況</div>
            <div className={styles.cell.header}>詳細</div>
            <div className={styles.cell.section}>AM</div>
            <div className={styles.cell.data}>
              {item.schedule?.amStatus ?? "-"}
            </div>
            <div className={styles.cell.data}>
              {item.schedule?.amDetail ?? "-"}
            </div>
            <div className={styles.cell.section}>PM</div>
            <div className={styles.cell.data}>
              {item.schedule?.pmStatus ?? "-"}
            </div>
            <div className={styles.cell.data}>
              {item.schedule?.pmDetail ?? "-"}
            </div>
          </div>
        ))}
      </div>
    );
  });

KokyuhyoModalContent.displayName = "KokyuhyoModalContent";

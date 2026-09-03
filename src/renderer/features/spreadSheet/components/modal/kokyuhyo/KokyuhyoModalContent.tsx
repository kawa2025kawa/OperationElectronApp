// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.tsx

import React, { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { commands } from "@renderer/services/commands";
import { type Kokyuhyo } from "@shared/types/spreadsheet";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";
import type { SpreadSheetModalProps } from "../modalRegistry";
import { useSpreadSheetModalContext } from "../spreadSheetModalContext";
import * as styles from "./KokyuhyoModalContent.css";

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

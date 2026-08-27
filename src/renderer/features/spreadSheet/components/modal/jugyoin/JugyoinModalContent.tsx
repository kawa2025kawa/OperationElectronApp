// src/renderer/features/spreadSheet/components/modal/jugyoin/JugyoinModalContent.tsx
import React, { useEffect } from "react";
import type { Jugyoin } from "@shared/types/spreadsheetTypes";
import type { SpreadSheetModalProps } from "../modalRegistry";
import { useSpreadSheetModalContext } from "../SpreadSheetModalContext";
import * as styles from "./JugyoinModalContent.css";
import { useJugyoinModalContent } from "./useJugyoinModalContent";

export const JugyoinModalContent: React.FC<SpreadSheetModalProps<Jugyoin>> =
  React.memo(({ data }) => {
    const { setHeaderRight } = useSpreadSheetModalContext();
    const { contact, scheduleLink, schedules, handleOpenSchedule } =
      useJugyoinModalContent(data);

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

JugyoinModalContent.displayName = "JugyoinModalContent";

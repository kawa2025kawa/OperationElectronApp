// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Kokyuhyo } from "@shared/types/spreadsheetTypes";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "../modal.css";
import { useKokyuhyoModalContent } from "./useKokyuhyoModalContent";

export const KokyuhyoModalContent: React.FC<SpreadSheetModalProps<Kokyuhyo>> =
  React.memo(({ data, title, onClose }) => {
    const { contact, scheduleLink, schedules, handleOpenSchedule } =
      useKokyuhyoModalContent(data);

    return (
      <div className={styles.modalContainer}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>{title}</h2>

          <div className={styles.textGroup}>
            <span>内線: {contact.extension}</span>
            <span>PHS短縮: {contact.mobileShort}</span>
            <span>携帯: {contact.mobile}</span>
          </div>

          {scheduleLink && (
            <button
              type="button"
              className={styles.button}
              data-variant="pill"
              onClick={handleOpenSchedule}
            >
              スケジュール表
            </button>
          )}

          <CloseButton onClick={onClose} />
        </header>

        {/* Schedule Table List */}
        <div className={styles.contentContainer}>
          {schedules.map((item) => (
            <div key={item.label} className={styles.tableGrid}>
              {/* 左側：日付（2行結合） */}
              <div className={styles.cell.date}>
                <div className={styles.value}>{item.label}</div>
                <div className={styles.label}>
                  {item.date.text}
                  <span style={item.date.dayStyle}>{item.date.dayText}</span>
                </div>
              </div>

              {/* 1行目：表頭（ヘッダー） */}
              <div className={styles.cell.header}>区分</div>
              <div className={styles.cell.header}>勤務</div>
              <div className={styles.cell.header}>備考</div>

              {/* 2行目：AM */}
              <div className={styles.cell.section}>AM</div>
              <div className={styles.cell.data}>
                {item.schedule?.amStatus ?? "-"}
              </div>
              <div className={styles.cell.data}>
                {item.schedule?.amDetail ?? "-"}
              </div>

              {/* 3行目：PM */}
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

        {/* Footer */}
        <footer className={styles.footer}>
          <button type="button" className={styles.button} onClick={onClose}>
            閉じる
          </button>
        </footer>
      </div>
    );
  });

KokyuhyoModalContent.displayName = "KokyuhyoModalContent";
export default KokyuhyoModalContent;

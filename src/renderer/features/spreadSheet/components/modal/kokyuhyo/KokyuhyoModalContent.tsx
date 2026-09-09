// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.tsx
import React, { useCallback } from "react";
import { addDays } from "date-fns";
import { commands } from "@renderer/services/commands";
import { type Kokyuhyo } from "@shared/types/spreadsheet";
import { formatDateWithDay } from "@renderer/features/spreadSheet/utils/scheduleUtils";
import type { ModalContentProps } from "../SpreadSheetModal";
import * as styles from "./KokyuhyoModalContent.css";

export const KokyuhyoModalContent: React.FC<ModalContentProps<Kokyuhyo>> =
  React.memo(({ data }) => {
    const scheduleLink =
      data?.scheduleLink && data.scheduleLink !== "-"
        ? data.scheduleLink
        : undefined;

    const handleOpenSchedule = useCallback(() => {
      if (scheduleLink) void commands.openExternal(scheduleLink);
    }, [scheduleLink]);

    const extension = data?.naisen || "-";
    const mobileShort = data?.tanshuku || "-";
    const mobile = data?.contactMobile || "-";
    const position = data?.position || "-";
    const email = data?.email || "-";

    const schedules = [
      {
        label: "本日",
        date: formatDateWithDay(new Date()),
        amStatus: data?.todayAmStatus || "-",
        amDetail: data?.todayAmDetail || "-",
        pmStatus: data?.todayPmStatus || "-",
        pmDetail: data?.todayPmDetail || "-",
      },
      {
        label: "明日",
        date: formatDateWithDay(addDays(new Date(), 1)),
        amStatus: data?.tomorrowAmStatus || "-",
        amDetail: data?.tomorrowAmDetail || "-",
        pmStatus: data?.tomorrowPmStatus || "-",
        pmDetail: data?.tomorrowPmDetail || "-",
      },
    ];

    return (
      <div className={styles.contentContainer}>
        {/* 1段目: 凸型要素で並べたプロフィール領域 */}
        <div className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>役職 : {position}</div>
            <div className={styles.profileItem}>Email : {email}</div>
            <div className={styles.profileItem}>内線 : {extension}</div>
            <div className={styles.profileItem}>PHS : {mobileShort}</div>
            <div className={styles.profileItem}>携帯 : {mobile}</div>
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
        </div>

        {/* 2段目・3段目: 本日/明日のスケジュール */}
        {schedules.map((item) => (
          <div key={item.label} className={styles.tableGrid}>
            {/* 1列目 (縦結合 span 3) */}
            <div className={styles.cell.date}>
              <div className={styles.value}>{item.label}</div>
              <div className={styles.label}>
                {item.date.text}
                <span style={item.date.dayStyle}>{item.date.dayText}</span>
              </div>
            </div>

            {/* 1行目 (ヘッダー: 2列目〜4列目) */}
            <div className={styles.cell.header}>区分</div>
            <div className={styles.cell.header}>状況</div>
            <div className={styles.cell.header}>詳細</div>

            {/* 2行目 (AM: 2列目〜4列目) */}
            <div className={styles.cell.section}>AM</div>
            <div className={styles.cell.data}>{item.amStatus}</div>
            <div className={styles.cell.data}>{item.amDetail}</div>

            {/* 3行目 (PM: 2列目〜4列目) */}
            <div className={styles.cell.section}>PM</div>
            <div className={styles.cell.data}>{item.pmStatus}</div>
            <div className={styles.cell.data}>{item.pmDetail}</div>
          </div>
        ))}
      </div>
    );
  });

KokyuhyoModalContent.displayName = "KokyuhyoModalContent";

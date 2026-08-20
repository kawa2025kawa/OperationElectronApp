// src/renderer/features/spreadSheet/components/modal/contents/JugyoinKokyuhyoModalContent.tsx
import React from "react";
import { addDays } from "date-fns";
import { commands } from "@shared/api/commands";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";
import type { Jugyoin, Kokyuhyo } from "@shared/types/spreadsheetTypes";
import { formatDateWithDay } from "@renderer/features/spreadSheet/Utils/scheduleUtils";
import { SpreadSheetModal } from "../SpreadSheetModal";

export const JugyoinKokyuhyoModalContent: React.FC<{
  data: Jugyoin | Kokyuhyo;
  title: string;
  onClose: () => void;
}> = React.memo(({ data, title, onClose }) => {
  const scheduleLink =
    data?.scheduleLink !== "-" ? data?.scheduleLink : undefined;
  const todayFormatted = formatDateWithDay(new Date());
  const tomorrowFormatted = formatDateWithDay(addDays(new Date(), 1));

  const schedules = [
    { label: "今日", date: todayFormatted, schedule: data.today },
    { label: "明日", date: tomorrowFormatted, schedule: data.tomorrow },
  ];

  const headerExtra = (
    <>
      <div className={styles.textGroup}>
        <span>内線: {data.contact?.extension ?? "-"}</span>
        <span>短縮: {data.contact?.mobileShort ?? "-"}</span>
        <span>携帯: {data.contact?.mobile ?? "-"}</span>
      </div>
      {scheduleLink && (
        <button
          type="button"
          className={styles.button}
          data-variant="pill"
          onClick={() => void commands.openExternal(scheduleLink)}
        >
          スケジュール
        </button>
      )}
    </>
  );

  return (
    <SpreadSheetModal title={title} onClose={onClose} headerExtra={headerExtra}>
      {schedules.map((item) => (
        <div
          key={item.label}
          className={styles.card}
          data-variant="schedule-row"
        >
          <div className={styles.card} data-variant="pressed">
            <div className={styles.value}>{item.label}</div>
            <div className={styles.label}>
              {item.date.text}
              <span style={item.date.dayStyle}>{item.date.dayText}</span>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>AM</div>
            <div className={styles.value}>{item.schedule?.amStatus ?? "-"}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>AM詳細</div>
            <div className={styles.value}>{item.schedule?.amDetail ?? "-"}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>PM</div>
            <div className={styles.value}>{item.schedule?.pmStatus ?? "-"}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.label}>PM詳細</div>
            <div className={styles.value}>{item.schedule?.pmDetail ?? "-"}</div>
          </div>
        </div>
      ))}
    </SpreadSheetModal>
  );
});
JugyoinKokyuhyoModalContent.displayName = "JugyoinKokyuhyoModalContent";
export default JugyoinKokyuhyoModalContent;

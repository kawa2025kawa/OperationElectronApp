// src/renderer/features/spreadSheet/components/modal/contents/common/JugyoinKokyuhyoModalContent.tsx
import React from "react";
import { commands } from "@shared/api/commands";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Jugyoin, Kokyuhyo } from "@shared/types/spreadsheetTypes";
import { useJugyoinModalLogic } from "../jugyoin/useJugyoinModalLogic";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";

export interface JugyoinKokyuhyoModalContentProps {
  data: Jugyoin | Kokyuhyo;
  title: string;
  onClose: () => void;
}

export const JugyoinKokyuhyoModalContent: React.FC<JugyoinKokyuhyoModalContentProps> =
  React.memo(({ data, title, onClose }) => {
    const { scheduleLink, todayFormatted, tomorrowFormatted } =
      useJugyoinModalLogic(data as Jugyoin);

    return (
      <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <div className={styles.contactInfo}>
            <span>内線: {data.contact?.extension ?? "-"}</span>
            <span>携帯(短): {data.contact?.mobileShort ?? "-"}</span>
            <span>携帯: {data.contact?.mobile ?? "-"}</span>
          </div>
          {scheduleLink && (
            <button
              type="button"
              className={styles.scheduleLinkButton}
              onClick={() => void commands.openExternal(scheduleLink)}
            >
              スケジュール
            </button>
          )}
          <CloseButton onClick={onClose} />
        </div>
        <div className={styles.modalContentContainer}>
          {/* 本日 */}
          <div className={styles.scheduleRow}>
            <div className={styles.dateLabelBlock}>
              <div>本日</div>
              <div className={styles.dateSubLabel}>
                {todayFormatted.text}
                <span style={todayFormatted.dayStyle}>
                  {todayFormatted.dayText}
                </span>
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>AM1</div>
              <div className={styles.infoValue}>
                {data.today?.amStatus ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>AM1詳細</div>
              <div className={styles.infoValue}>
                {data.today?.amDetail ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>PM1</div>
              <div className={styles.infoValue}>
                {data.today?.pmStatus ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>PM1詳細</div>
              <div className={styles.infoValue}>
                {data.today?.pmDetail ?? "-"}
              </div>
            </div>
          </div>
          {/* 明日 */}
          <div className={styles.scheduleRow}>
            <div className={styles.dateLabelBlock}>
              <div>明日</div>
              <div className={styles.dateSubLabel}>
                {tomorrowFormatted.text}
                <span style={tomorrowFormatted.dayStyle}>
                  {tomorrowFormatted.dayText}
                </span>
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>AM1</div>
              <div className={styles.infoValue}>
                {data.tomorrow?.amStatus ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>AM1詳細</div>
              <div className={styles.infoValue}>
                {data.tomorrow?.amDetail ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>PM1</div>
              <div className={styles.infoValue}>
                {data.tomorrow?.pmStatus ?? "-"}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>PM1詳細</div>
              <div className={styles.infoValue}>
                {data.tomorrow?.pmDetail ?? "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

JugyoinKokyuhyoModalContent.displayName = "JugyoinKokyuhyoModalContent";
export default JugyoinKokyuhyoModalContent;

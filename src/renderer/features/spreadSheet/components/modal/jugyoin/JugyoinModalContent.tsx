// src/renderer/features/spreadSheet/components/modal/jugyoin/JugyoinModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Jugyoin } from "@shared/types/spreadsheet";
import { useJugyoinModalContent } from "./useJugyoinModalContent";
import * as styles from "./JugyoinModalContent.css";

export interface JugyoinModalContentProps {
  data: Jugyoin;
}

export const JugyoinModalContent: GlobalModalComponent<JugyoinModalContentProps> =
  React.memo(({ data }) => {
    const { state, actions } = useJugyoinModalContent(data);
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);
    const closeModal = useAppStore((s) => s.closeGlobalModal);

    // 🎯 子側から親 (GlobalModalManager) のフッター領域へ「閉じる」ボタン単体を注入
    useEffect(() => {
      updateModalConfig({
        footerContent: (
          <ActionButton variant="default" onClick={closeModal}>
            閉じる
          </ActionButton>
        ),
      });
    }, [updateModalConfig, closeModal]);

    return (
      <div className={styles.contentContainer}>
        {/* プロフィール領域 */}
        <div className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              役職 : {state.profile.position}
            </div>
            <div className={styles.profileItem}>
              Email : {state.profile.email}
            </div>
            <div className={styles.profileItem}>
              内線 : {state.profile.extension}
            </div>
            <div className={styles.profileItem}>
              PHS : {state.profile.mobileShort}
            </div>
            <div className={styles.profileItem}>
              携帯 : {state.profile.mobile}
            </div>
          </div>
          {state.hasScheduleLink && (
            <ActionButton onClick={actions.handleOpenSchedule}>
              Schedulelink
            </ActionButton>
          )}
        </div>

        {/* スケジュール領域 */}
        {state.schedules.map((item) => (
          <div key={item.label} className={styles.tableGrid}>
            <div className={styles.cell.date}>
              <div className={styles.value}>{item.label}</div>
              <div className={styles.label}>
                {item.date.text}
                <span style={item.date.dayStyle}>{item.date.dayText}</span>
              </div>
            </div>
            <div className={styles.cell.header}>状態</div>
            <div className={styles.cell.header}>詳細</div>
            <div className={styles.cell.header}>備考</div>
            <div className={styles.cell.section}>AM</div>
            <div className={styles.cell.data}>{item.amStatus}</div>
            <div className={styles.cell.data}>{item.amDetail}</div>
            <div className={styles.cell.section}>PM</div>
            <div className={styles.cell.data}>{item.pmStatus}</div>
            <div className={styles.cell.data}>{item.pmDetail}</div>
          </div>
        ))}
      </div>
    );
  });

JugyoinModalContent.modalSize = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

JugyoinModalContent.displayName = "JugyoinModalContent";

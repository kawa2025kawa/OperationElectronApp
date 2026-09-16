// src/renderer/features/spreadSheet/components/modal/kokyuhyo/KokyuhyoModalContent.tsx

import React from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Kokyuhyo } from "@shared/types/spreadsheet";
import { useKokyuhyoModalContent } from "./useKokyuhyoModalContent";
import * as styles from "./KokyuhyoModalContent.css";

export interface KokyuhyoModalContentProps {
  data: Kokyuhyo;
}

export const KokyuhyoModalContent: GlobalModalComponent<KokyuhyoModalContentProps> =
  React.memo(({ data }) => {
    const { state, actions } = useKokyuhyoModalContent(data);

    return (
      <div className={styles.contentContainer}>
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
              短縮 : {state.profile.mobileShort}
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

KokyuhyoModalContent.modalSize = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

KokyuhyoModalContent.displayName = "KokyuhyoModalContent";

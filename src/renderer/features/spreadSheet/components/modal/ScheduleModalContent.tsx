// src/renderer/features/spreadSheet/components/modal/ScheduleModalContent.tsx

import { memo } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { SCHEDULE_MODAL_LABELS } from "./scheduleModalConfig";
import {
  useScheduleModalContent,
  type ScheduleModalTarget,
} from "./useScheduleModalContent";
import * as styles from "./scheduleModalContent.css";

export interface ScheduleModalContentProps {
  data: ScheduleModalTarget;
  variant: "jugyoin" | "kokyuhyo";
}

const { PROFILE, TABLE_HEADER } = SCHEDULE_MODAL_LABELS;

export const ScheduleModalContent: GlobalModalComponent<ScheduleModalContentProps> =
  memo(({ data, variant }) => {
    const { state, actions } = useScheduleModalContent(data);
    const mobileShortLabel =
      variant === "jugyoin"
        ? PROFILE.MOBILE_SHORT_JUGYOIN
        : PROFILE.MOBILE_SHORT_KOKYUHYO;

    return (
      <div className={styles.contentContainer}>
        <div className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              {PROFILE.POSITION} : {state.profile.position}
            </div>
            <div className={styles.profileItem}>
              {PROFILE.EMAIL} : {state.profile.email}
            </div>
            <div className={styles.profileItem}>
              {PROFILE.EXTENSION} : {state.profile.extension}
            </div>
            <div className={styles.profileItem}>
              {mobileShortLabel} : {state.profile.mobileShort}
            </div>
            <div className={styles.profileItem}>
              {PROFILE.MOBILE} : {state.profile.mobile}
            </div>
          </div>
          {state.hasScheduleLink && (
            <ActionButton onClick={actions.handleOpenSchedule}>
              {PROFILE.SCHEDULE_LINK}
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
            <div className={styles.cell.header}>{TABLE_HEADER.CATEGORY}</div>
            <div className={styles.cell.header}>{TABLE_HEADER.LOCATION}</div>
            <div className={styles.cell.header}>{TABLE_HEADER.DETAIL}</div>
            <div className={styles.cell.section}>{TABLE_HEADER.AM}</div>
            <div className={styles.cell.data}>{item.amStatus}</div>
            <div className={styles.cell.data}>{item.amDetail}</div>
            <div className={styles.cell.section}>{TABLE_HEADER.PM}</div>
            <div className={styles.cell.data}>{item.pmStatus}</div>
            <div className={styles.cell.data}>{item.pmDetail}</div>
          </div>
        ))}
      </div>
    );
  });

ScheduleModalContent.displayName = "ScheduleModalContent";

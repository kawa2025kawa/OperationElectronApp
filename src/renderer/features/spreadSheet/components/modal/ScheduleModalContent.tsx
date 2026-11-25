// src/renderer/features/spreadSheet/components/modal/ScheduleModalContent.tsx

import { memo } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { dayTone } from "../table/spreadSheetTable.css";
import {
  useScheduleModalContent,
  type ScheduleModalTarget,
} from "./useScheduleModalContent";
import * as styles from "./scheduleModalContent.css";

export interface ScheduleModalContentProps {
  data: ScheduleModalTarget;
}

const PROFILE_LABELS = {
  POSITION: "役職",
  EMAIL: "Email",
  EXTENSION: "内線",
  MOBILE_SHORT: "短縮",
  MOBILE: "携帯",
  SCHEDULE_LINK: "Schedulelink",
} as const;

const TABLE_HEADER_LABELS = {
  CATEGORY: "区分",
  LOCATION: "場所",
  DETAIL: "詳細",
  AM: "AM",
  PM: "PM",
} as const;

export const ScheduleModalContent: GlobalModalComponent<ScheduleModalContentProps> =
  memo(({ data }) => {
    const { state, actions } = useScheduleModalContent(data);

    return (
      <div className={styles.contentContainer}>
        <div className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              {PROFILE_LABELS.POSITION} : {state.profile.position}
            </div>
            <div className={styles.profileItem}>
              {PROFILE_LABELS.EMAIL} : {state.profile.email}
            </div>
            <div className={styles.profileItem}>
              {PROFILE_LABELS.EXTENSION} : {state.profile.extension}
            </div>
            <div className={styles.profileItem}>
              {PROFILE_LABELS.MOBILE_SHORT} : {state.profile.mobileShort}
            </div>
            <div className={styles.profileItem}>
              {PROFILE_LABELS.MOBILE} : {state.profile.mobile}
            </div>
          </div>
          {state.hasScheduleLink && (
            <ActionButton onClick={actions.handleOpenSchedule}>
              {PROFILE_LABELS.SCHEDULE_LINK}
            </ActionButton>
          )}
        </div>
        {state.schedules.map((item) => {
          const dayClass =
            item.date.tone === "weekday" ? undefined : dayTone[item.date.tone];

          return (
            <div key={item.label} className={styles.tableGrid}>
              <div className={styles.cell.date}>
                <div className={styles.value}>{item.label}</div>
                <div className={styles.label}>
                  {item.date.text}
                  <span className={dayClass}>{item.date.dayText}</span>
                </div>
              </div>
              <div className={styles.cell.header}>
                {TABLE_HEADER_LABELS.CATEGORY}
              </div>
              <div className={styles.cell.header}>
                {TABLE_HEADER_LABELS.LOCATION}
              </div>
              <div className={styles.cell.header}>
                {TABLE_HEADER_LABELS.DETAIL}
              </div>
              <div className={styles.cell.section}>{TABLE_HEADER_LABELS.AM}</div>
              <div className={styles.cell.data}>{item.amStatus}</div>
              <div className={styles.cell.data}>{item.amDetail}</div>
              <div className={styles.cell.section}>{TABLE_HEADER_LABELS.PM}</div>
              <div className={styles.cell.data}>{item.pmStatus}</div>
              <div className={styles.cell.data}>{item.pmDetail}</div>
            </div>
          );
        })}
      </div>
    );
  });

ScheduleModalContent.displayName = "ScheduleModalContent";

// src/renderer/features/spreadSheet/components/modal/contents/tantou/TantouModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Tantou } from "@shared/types/spreadsheetTypes";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";
import {
  useTabbedModalLogic,
  type TabGroupConfig,
} from "../common/useTabbedModalLogic";

const TANTOU_FIELDS = [
  { key: "hayaban", label: "早番" },
  { key: "shikai", label: "司会" },
  { key: "uketsuke", label: "受付" },
  { key: "denwa", label: "電話" },
  { key: "nimotsu", label: "荷物" },
  { key: "2F", label: "2F担当" },
  { key: "3F", label: "3F担当" },
  { key: "tensou", label: "転送" },
  { key: "amAttendanceRate", label: "AM出勤率" },
  { key: "pmAttendanceRate", label: "PM出勤率" },
];

// ⭕ export を外してファイル内ローカル定数に変更
const TANTOU_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "本日",
    items: TANTOU_FIELDS.map((f) => ({
      key: `today.${f.key}`,
      label: f.label,
    })),
  },
  {
    title: "明日",
    items: TANTOU_FIELDS.map((f) => ({
      key: `tomorrow.${f.key}`,
      label: f.label,
    })),
  },
] as const;

export interface TantouModalContentProps {
  data: Tantou;
  title: string;
  onClose: () => void;
}

export const TantouModalContent: React.FC<TantouModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { groups, selectedIndex, setSelectedIndex, displayItems } =
      useTabbedModalLogic(
        data as unknown as Record<string, unknown>,
        TANTOU_MODAL_GROUPS,
      );

    return (
      <div className={styles.modalWrapper}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className={styles.tabContainer}>
          {groups.map((group, idx) => (
            <button
              key={group.title}
              className={styles.tabButton}
              data-active={selectedIndex === idx}
              onClick={() => setSelectedIndex(idx)}
              type="button"
            >
              {group.title}
            </button>
          ))}
        </div>

        <div className={styles.modalContentContainer}>
          <div className={styles.gridContainer}>
            {displayItems.map((item) => (
              <div key={item.label} className={styles.infoBlock}>
                <div className={styles.infoLabel}>{item.label}</div>
                <div className={styles.infoValue}>
                  {String(item.value ?? "-")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

TantouModalContent.displayName = "TantouModalContent";
export default TantouModalContent;

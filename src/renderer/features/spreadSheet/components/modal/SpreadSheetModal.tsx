// src/renderer/features/spreadSheet/components/modal/SpreadSheetModal.tsx
import React, { useState, useMemo } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";
import * as styles from "./spreadSheetModal.css";

const CloseButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (
  props,
) => (
  <button
    type="button"
    aria-label="閉じる"
    className={styles.button}
    data-variant="icon"
    {...props}
  >
    ×
  </button>
);

export interface TabGroupConfig {
  title: string;
  items: { key: string; label: string }[];
}

export interface SpreadSheetModalProps {
  title: string;
  onClose: () => void;
  headerExtra?: React.ReactNode;
  data?: Record<string, unknown>;
  groupConfigs?: readonly TabGroupConfig[];
  fullWidthKeys?: string[];
  children?: React.ReactNode;
}

export const SpreadSheetModal: React.FC<SpreadSheetModalProps> = React.memo(
  ({
    title,
    onClose,
    headerExtra,
    data,
    groupConfigs,
    fullWidthKeys = [],
    children,
  }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const groups = useMemo(() => {
      if (!data || !groupConfigs) return [];
      return groupConfigs.map((group) => ({
        title: group.title,
        items: group.items.map((item) => {
          const rawVal = getValueByPath(data, item.key);
          return {
            label: item.label,
            value:
              rawVal !== "" && rawVal !== null && rawVal !== undefined
                ? rawVal
                : "-",
          };
        }),
      }));
    }, [data, groupConfigs]);

    const displayItems = groups[selectedIndex]?.items ?? [];
    const hasTabs = groupConfigs && groupConfigs.length > 0;

    return (
      <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>{title}</h2>
          {headerExtra}
          <CloseButton onClick={onClose} />
        </div>

        {hasTabs && (
          <div
            className={styles.pressedSection}
            style={{ padding: "1vmin", flexShrink: 0 }}
          >
            {groups.map((group, idx) => (
              <button
                key={group.title}
                type="button"
                className={styles.button}
                data-variant="tab"
                data-active={selectedIndex === idx}
                onClick={() => setSelectedIndex(idx)}
              >
                {group.title}
              </button>
            ))}
          </div>
        )}

        <div className={styles.modalContentContainer}>
          {hasTabs ? (
            <div className={styles.gridContainer}>
              {displayItems.map((item, i) => (
                <div
                  key={item.label || i}
                  className={styles.card}
                  data-full-width={fullWidthKeys.includes(item.label)}
                >
                  <div className={styles.label}>{item.label}</div>
                  <div className={styles.value}>
                    {String(item.value ?? "-")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  },
);
SpreadSheetModal.displayName = "SpreadSheetModal";

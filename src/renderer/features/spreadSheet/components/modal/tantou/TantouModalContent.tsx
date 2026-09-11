// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.tsx

import React from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Tantou } from "@shared/types/spreadsheet";
import { useTantouModalContent } from "./useTantouModalContent";
import * as styles from "./TantouModalContent.css";

export interface TantouModalContentProps {
  data: Tantou;
}

export const TantouModalContent: GlobalModalComponent<TantouModalContentProps> =
  React.memo(({ data }) => {
    const { state, actions } = useTantouModalContent(data);

    return (
      <div className={styles.mainContainer}>
        {/* タブヘッダー */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={styles.button}
            data-variant="tab"
            data-active={state.selectedIndex === 0}
            onClick={() => actions.setSelectedIndex(0)}
          >
            {state.todayLabel}
          </button>
          <button
            type="button"
            className={styles.button}
            data-variant="tab"
            data-active={state.selectedIndex === 1}
            onClick={() => actions.setSelectedIndex(1)}
          >
            {state.tomorrowLabel}
          </button>
        </div>

        {/* コンテンツ本体 */}
        <div className={styles.contentContainer}>
          <div className={styles.terminalSection}>
            {state.displayItems.map((item) => (
              <div key={item.label} className={styles.terminalRow}>
                <div className={styles.nonTrBadge}>{item.label}</div>
                <div className={styles.flexCell}>
                  <div className={styles.cellValue}>{item.value || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

TantouModalContent.modalSize = {
  width: "min(90vw, 800px)",
  height: "min(75vh, 650px)",
};

TantouModalContent.modalConfig = {
  cancelText: "閉じる",
};

TantouModalContent.displayName = "TantouModalContent";

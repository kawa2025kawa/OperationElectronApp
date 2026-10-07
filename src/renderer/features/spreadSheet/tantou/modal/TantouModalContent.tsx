import { memo } from "react";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { useTantouModalContent } from "./useTantouModalContent";
import * as styles from "./TantouModalContent.css";

export interface TantouModalContentProps {
  data: Tantou;
}

export const TantouModalContent: GlobalModalComponent<TantouModalContentProps> =
  memo(({ data }) => {
    const { state, actions } = useTantouModalContent(data);
    return (
      <div className={styles.mainContainer}>
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

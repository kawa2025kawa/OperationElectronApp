// src/renderer/components/ui/button/pollingToggleButton/PollingToggleButton.tsx

import { usePollingToggleButton } from "./usePollingToggleButton";
import * as styles from "./pollingToggleButton.css";

export const PollingToggleButton = () => {
  const { isPolling, title, handleClick } = usePollingToggleButton();

  return (
    <button
      type="button"
      tabIndex={-1}
      onFocus={(e) => e.currentTarget.blur()}
      className={styles.button}
      aria-pressed={isPolling}
      aria-label={isPolling ? "システム監視中" : "システム監視停止中"}
      title={title}
      onClick={handleClick}
    >
      <span className={styles.indicator}>
        <span className={styles.dot} />
      </span>

      <span className={styles.label}>
        <span className={styles.textSpan}>
          {isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </span>
      </span>
    </button>
  );
};

// src/renderer/components/ui/button/pollingToggleButton/PollingToggleButton.tsx

import { Toggle } from "@base-ui/react/toggle";

import { usePollingToggleButton } from "./usePollingToggleButton";
import * as styles from "./pollingToggleButton.css";

export const PollingToggleButton = () => {
  const { isPolling, title, handleClick } = usePollingToggleButton();

  return (
    <Toggle
      type="button"
      tabIndex={-1}
      onFocus={(event) => event.currentTarget.blur()}
      className={styles.button}
      pressed={isPolling}
      aria-label={isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
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
    </Toggle>
  );
};

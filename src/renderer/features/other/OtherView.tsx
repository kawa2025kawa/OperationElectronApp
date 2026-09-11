import React from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import { useOtherViewLogic } from "./useOtherViewLogic";
import * as styles from "./otherView.css";

export const OtherView: React.FC = React.memo(() => {
  const { state } = useOtherViewLogic();

  return (
    <div className={clsx(styles.container, animateFadeIn)}>
      <div className={styles.grid}>
        {state.tools.map((tool) => (
          <button
            key={tool.id}
            className={styles.card}
            onClick={tool.onClick}
            type="button"
          >
            {tool.name}
          </button>
        ))}
      </div>
    </div>
  );
});

OtherView.displayName = "OtherView";

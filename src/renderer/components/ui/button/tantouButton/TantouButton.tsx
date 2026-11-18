// src/renderer/components/ui/button/tantouButton/TantouButton.tsx

import { memo } from "react";
import { useTantouButton } from "./useTantouButton";
import * as styles from "./tantouButton.css";

export const TantouButton = memo(() => {
  const { isDisabled, handleClick } = useTantouButton();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={isDisabled}
      title="当日の担当者一覧を表示"
    >
      担当表
    </button>
  );
});

TantouButton.displayName = "TantouButton";
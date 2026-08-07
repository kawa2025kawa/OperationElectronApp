// src\renderer\components\ui\button\hamburgerButton\HamburgerButton.tsx
import React from "react";
import * as styles from "./hamburgerButton.css";

interface HamburgerButtonProps {
  onClick: () => void;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      aria-label="メニューを開く"
    >
      {/* 🎯 修正: 三本線のハンバーガーアイコンを綺麗に描写 */}
      <div className={styles.line} />
      <div className={styles.line} />
      <div className={styles.line} />
    </button>
  );
};

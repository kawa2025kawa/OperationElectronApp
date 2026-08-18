// src/renderer/components/layout/nav/components/HamburgerButton.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@shared/store";
import * as styles from "./hamburgerButton.css";

export const HamburgerButton: React.FC = () => {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const handleClick = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-label="メニューを開く"
    >
      <div className={styles.line} />
      <div className={styles.line} />
      <div className={styles.line} />
    </button>
  );
};

export default HamburgerButton;

// src/renderer/components/layout/nav/components/HamburgerButton.tsx

import { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import * as styles from "./hamburgerButton.css";

export const HamburgerButton = () => {
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

HamburgerButton;

// src/renderer/components/layout/nav/components/HamburgerButton.tsx

import { useAppStore } from "@renderer/store";
import * as styles from "./hamburgerButton.css";

export const HamburgerButton = () => {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const handleClick = () => {
    toggleSidebar();
  };

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

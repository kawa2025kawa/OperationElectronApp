// src/renderer/components/layout/footer/components/FooterActionButton.tsx

import { memo } from "react";
import * as styles from "./footerActionButton.css";

interface FooterActionButtonProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export const FooterActionButton = memo(function FooterActionButton({
  label,
  isActive = false,
  onClick,
}: FooterActionButtonProps) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span className={styles.actionButtonText}>{label}</span>
    </button>
  );
});

// src/renderer/components/layout/footer/components/FooterActionButton.tsx

import React from "react";
import * as styles from "./footerActionButton.css";

interface FooterActionButtonProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export const FooterActionButton: React.FC<FooterActionButtonProps> = ({
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      className={styles.actionButton}
      data-active={isActive}
      onClick={onClick}
      type="button"
    >
      <span className={styles.actionButtonText}>{label}</span>
    </button>
  );
};

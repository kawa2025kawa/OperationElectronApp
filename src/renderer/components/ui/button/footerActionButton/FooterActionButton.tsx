//src\renderer\components\ui\button\footerActionButton\FooterActionButton.tsx

import React from "react";
import { clsx } from "clsx";
import * as styles from "./footerActionButton.css";

interface FooterActionButtonProps {
  label: string;
  isActive?: boolean;
  isPill?: boolean;
  onClick: () => void;
}

export const FooterActionButton: React.FC<FooterActionButtonProps> = ({
  label,
  isActive = false,
  isPill = false,
  onClick,
}) => {
  return (
    <button
      className={clsx(
        styles.actionButton,
        isPill ? styles.pillShape : styles.circleShape,
      )}
      data-active={isActive}
      onClick={onClick}
      type="button"
    >
      <span className={styles.actionButtonText}>{label}</span>
    </button>
  );
};

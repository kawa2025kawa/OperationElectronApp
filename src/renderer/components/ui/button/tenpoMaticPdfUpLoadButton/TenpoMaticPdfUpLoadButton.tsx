// src/renderer/components/ui/button/tenpoMaticPdfUpLoadButton/TenpoMaticPdfUpLoadButton.tsx

import React from "react";
import { clsx } from "clsx";
import {
  useTenpoMaticPdfUpLoadButton,
  type TenpoMaticPdfUpLoadButtonProps,
} from "./useTenpoMaticPdfUpLoadButton";
import * as styles from "./tenpoMaticPdfUpLoadButton.css";

const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM13 9V3.5L18.5 9H13Z" />
  </svg>
);

export const TenpoMaticPdfUpLoadButton: React.FC<TenpoMaticPdfUpLoadButtonProps> =
  React.memo((props) => {
    const { displayLabel, isDisabled, buttonProps } =
      useTenpoMaticPdfUpLoadButton(props);

    return (
      <button
        type="button"
        className={clsx(styles.container, props.className)}
        disabled={isDisabled}
        {...buttonProps}
      >
        <PdfIcon className={styles.icon} />
        <span className={styles.label}>{displayLabel}</span>
      </button>
    );
  });

TenpoMaticPdfUpLoadButton.displayName = "TenpoMaticPdfUpLoadButton";
export default TenpoMaticPdfUpLoadButton;

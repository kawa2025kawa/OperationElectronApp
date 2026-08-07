/* src/renderer/components/ui/button/tantouButton/TantouButton.tsx */

import React from "react";

import * as styles from "./tantouButton.css";

export interface TantouButtonProps {
  onClick: () => void;
}

export const TantouButton: React.FC<TantouButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.button} onClick={onClick} type="button">
      本日の担当者
    </button>
  );
};

//src\renderer\features\operation\components\modal\shared\InfoField.tsx

import React from "react";
import * as styles from "./infoField.css";

export interface InfoFieldProps {
  label: string;
  value?: string | number | null | undefined;
  span: 2 | 3 | 6;
  isComment?: boolean;
}

const spanClassMap = {
  2: styles.colSpan2,
  3: styles.colSpan3,
  6: styles.colSpan6,
};

export const InfoField: React.FC<InfoFieldProps> = React.memo(
  ({ label, value, span, isComment }) => (
    <div className={spanClassMap[span]}>
      <span className={styles.cardLabel}>{label}</span>
      <span className={isComment ? styles.commentValue : styles.cardValue}>
        {value ?? "-"}
      </span>
    </div>
  ),
);

InfoField.displayName = "InfoField";

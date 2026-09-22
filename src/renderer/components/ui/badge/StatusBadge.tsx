// src/renderer/components/ui/badge/StatusBadge.tsx

import React from "react";
import {
  JOB_STATUS,
  STATUS_LABEL,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import * as styles from "./statusBadge.css";

interface StatusBadgeProps {
  status?: JobStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(
  ({ status = JOB_STATUS.SCHEDULED }) => {
    const toneClass = styles.tone[status] ?? styles.tone.scheduled;
    const label = STATUS_LABEL[status] ?? status;

    return <div className={`${styles.badge} ${toneClass}`}>{label}</div>;
  },
);

StatusBadge.displayName = "StatusBadge";

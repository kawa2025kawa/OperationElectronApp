// src/renderer/components/ui/badge/StatusBadge.tsx

import { memo } from "react";

import {
  JOB_STATUS,
  JOB_STATUS_LABEL,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusBadge.css";

interface StatusBadgeProps {
  status?: JobStatus;
}

export const StatusBadge = memo<StatusBadgeProps>(
  ({ status = JOB_STATUS.SCHEDULED }) => {
    const toneClass = styles.tone[status] ?? styles.tone.scheduled;

    const label = JOB_STATUS_LABEL[status] ?? status;

    return <div className={`${styles.badge} ${toneClass}`}>{label}</div>;
  },
);

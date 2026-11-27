// src/renderer/components/ui/badge/StatusBadge.tsx

import { memo } from "react";
import { clsx } from "clsx";

import { normalizeDisplayStatus } from "@renderer/features/operation/utils/operationDisplayUtils";
import { JOB_STATUS_LABEL } from "@renderer/styles/tokens/statusTheme";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusBadge.css";

interface StatusBadgeProps {
  status?: JobStatus;
}

export const StatusBadge = memo<StatusBadgeProps>(
  ({ status = JOB_STATUS.SCHEDULED }) => {
    const displayStatus = normalizeDisplayStatus(status);
    const toneClass = styles.tone[displayStatus] ?? styles.tone.scheduled;
    const label = JOB_STATUS_LABEL[displayStatus] ?? displayStatus;

    return <div className={clsx(styles.badge, toneClass)}>{label}</div>;
  },
);

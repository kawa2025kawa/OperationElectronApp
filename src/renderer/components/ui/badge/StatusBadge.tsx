// src/renderer/components/ui/badge/StatusBadge.tsx

import type { JobStatus } from "@shared/types/operationType";
import { STATUS_LABEL } from "@shared/types/uiType";
import * as styles from "./statusBadge.css";

export interface StatusBadgeProps {
  status?: JobStatus | undefined;
}

export function StatusBadge({ status = "scheduled" }: StatusBadgeProps) {
  // CSS側のキーに変換（安全化）
  const cssKey = status.toLowerCase() as keyof typeof styles.tone;

  const toneClass = styles.tone[cssKey] ?? styles.tone.neutral;

  return (
    <div className={`${styles.badge} ${toneClass}`}>{STATUS_LABEL[status]}</div>
  );
}

export default StatusBadge;

// src/renderer/features/operation/components/OperationInfoRow.tsx

import { memo } from "react";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import {
  JOB_STATUS_VALUES,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import type { InfoRowData } from "@renderer/features/operation/utils/operationDisplayUtils";
import * as styles from "./operationInfoRow.css";

type OperationInfoRowProps = InfoRowData;

function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (JOB_STATUS_VALUES as readonly string[]).includes(value)
  );
}

export const OperationInfoRow = memo(function OperationInfoRow({
  label,
  value,
  type,
}: OperationInfoRowProps) {
  const isStatus = type === "status" && isJobStatus(value);

  return (
    <div className={styles.row} data-remarks={type === "remarks"}>
      <span>{label}</span>

      <span className={styles.resultValue}>
        {isStatus ? <StatusBadge status={value} /> : value}
      </span>
    </div>
  );
});

OperationInfoRow.displayName = "OperationInfoRow";

// src/renderer/features/operation/components/operationInfoRow/OperationInfoRow.tsx

import { memo } from "react";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import {
  isJobStatus,
  type InfoRowData,
} from "@renderer/features/operation/utils/operationDisplayUtils";
import * as styles from "./operationInfoRow.css";

type OperationInfoRowProps = InfoRowData;

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
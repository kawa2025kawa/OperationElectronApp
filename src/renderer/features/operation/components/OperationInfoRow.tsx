import { memo } from "react";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { JobStatus } from "@shared/types/operation/operationTypes";

import type { InfoRowData } from "../operationViewDisplayConfig";
import * as styles from "../operationView.css";

type OperationInfoRowProps = InfoRowData;

export const OperationInfoRow = memo(function OperationInfoRow({
  label,
  value,
  type,
}: OperationInfoRowProps) {
  return (
    <div className={styles.row} data-remarks={type === "remarks"}>
      <span>{label}</span>

      <span className={styles.resultValue}>
        {type === "status" && value ? (
          <StatusBadge status={value as JobStatus} />
        ) : (
          value
        )}
      </span>
    </div>
  );
});

OperationInfoRow.displayName = "OperationInfoRow";

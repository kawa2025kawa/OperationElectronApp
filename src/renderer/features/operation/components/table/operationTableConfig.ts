// src/renderer/features/operation/components/table/operationTable.config.ts

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import * as styles from "./operationTable.css";

export interface OperationColumnMeta {
  readonly label: string;
  readonly width: string;
  readonly align?: keyof typeof styles.alignVariants;
}

export const OPERATION_COLUMN_CONFIG = {
  kanriNo: {
    label: "管理No",
    width: "90px",
  },
  scheduledTime: {
    label: "予定時刻",
    width: "120px",
  },
  cycle: {
    label: "cycle",
    width: "100px",
    align: "center",
  },
  workName: {
    label: "作業名",
    width: "auto",
  },
  jobId: {
    label: "ジョブID",
    width: "auto",
  },
  status: {
    label: "ステータス",
    width: "140px",
    align: "center",
  },
} as const satisfies Record<string, OperationColumnMeta>;

export type OperationColumn = keyof typeof OPERATION_COLUMN_CONFIG;

export const VISIBLE_OPERATION_COLUMNS = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: ["kanriNo", "scheduledTime", "cycle", "workName"],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
} as const satisfies Record<ViewMode, readonly OperationColumn[]>;

export const EMPTY_OPERATION_ROWS = [] as const;

// src/renderer/components/ui/statusSummary/statusSummaryConfig.ts

import {
  JOB_STATUS_LABEL,
  JOB_STATUS_VALUES,
} from "@shared/types/operation/operationTypes";
import type { SummaryDisplayKey } from "@shared/types/statusSummary/statusSummaryTypes";

export const SUMMARY_DISPLAY_ORDER = [
  "progress",
  "total",
  ...JOB_STATUS_VALUES,
] as const satisfies readonly SummaryDisplayKey[];

export const SUMMARY_LABEL: Record<"total" | "progress", string> = {
  total: "対象件数",
  progress: "進捗率",
};

export function getSummaryLabel(key: SummaryDisplayKey): string {
  if (key === "total" || key === "progress") {
    return SUMMARY_LABEL[key];
  }

  return JOB_STATUS_LABEL[key];
}

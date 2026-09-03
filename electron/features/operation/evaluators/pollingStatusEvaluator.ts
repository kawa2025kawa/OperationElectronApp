// electron/features/operation/helpers/trackerValidationHelper.ts

import type { OperationItem } from "@shared/types/operation";

export function validateJobId(target: OperationItem): string {
  if (
    target.kind !== "operation" ||
    typeof target.jobId !== "string" ||
    target.jobId.trim().length === 0 ||
    target.jobId === "-"
  ) {
    throw new Error(`Invalid jobId kanriNo=${target.kanriNo}`);
  }
  return target.jobId.trim();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

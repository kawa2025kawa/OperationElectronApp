// electron/features/operation/helpers/trackerValidationHelper.ts
import type { OperationItem } from "@shared/types/operationType";

export function validateJobId(target: OperationItem): string {
  if (
    !("jobId" in target) ||
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

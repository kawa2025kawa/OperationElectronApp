// electron/features/operation/domain/operationRules.ts

import type { OperationMaster } from "@shared/types/operation/operationTypes";

const CENTER_FLAGS: ReadonlySet<string> = new Set(["1C", "2C", "3C"]);

const PREVIOUS_DAY_KANRI_NOS: ReadonlySet<string> = new Set([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);

const PDF_UPLOAD_KANRI_NOS: ReadonlySet<string> = new Set([
  "30",
  "37",
  "45",
  "48",
  "54",
]);

export function normalizeKanriNo(kanriNo: string | number): string {
  return String(kanriNo).trim();
}

export function isPreviousDayJob(
  kanriNo: string | number,
  scheduledTime?: string | null,
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);
  return (
    PREVIOUS_DAY_KANRI_NOS.has(normalizedKanriNo) ||
    scheduledTime?.includes("前日") === true
  );
}

export function isPdfUploadJob(kanriNo: string | number): boolean {
  return PDF_UPLOAD_KANRI_NOS.has(normalizeKanriNo(kanriNo));
}

export function hasCenterFlagDependency(dependencies: string[]): boolean {
  return dependencies.some((dep) => CENTER_FLAGS.has(dep));
}

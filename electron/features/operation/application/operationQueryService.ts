// electron/features/operation/application/operationQueryService.ts

import { isPdfUploadJob } from "@electron/features/operation/domain/operationRules";
import { isRunningStatus } from "@electron/features/operation/domain/statusRules";
import { getScriptExecutionRequirement } from "./scriptExecutionRequirements";
import { statusStore } from "./statusStore";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
  type SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";
import type {
  JobStatus,
  OperationScriptKey,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

export function getStatusSummary(): StatusSummary {
  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,
    total: statusStore.targets.size,
  };

  for (const [kanriNo] of statusStore.targets) {
    const status = statusStore.statuses.get(kanriNo)?.status;
    if (!status || !(status in summary)) {
      continue;
    }
    summary[status] += 1;
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
  return summary;
}

export function getSummaryDetails(filterKey: string): SummaryDetailRow[] {
  const normalizedFilter = filterKey.trim().toLowerCase();
  const results: SummaryDetailRow[] = [];

  for (const [, target] of statusStore.targets) {
    const statusState = statusStore.statuses.get(target.kanriNo);
    const currentStatus = statusState?.status;
    if (!matchesSummaryFilter(normalizedFilter, currentStatus)) {
      continue;
    }

    const row: SummaryDetailRow = {
      kanriNo: target.kanriNo,
      workName: target.workName || `No.${target.kanriNo}`,
      status: currentStatus,
      comment: statusState?.comment ?? undefined,
    };

    if ("jobId" in target && target.jobId !== undefined) {
      row.jobId = String(target.jobId);
    }

    results.push(row);
  }

  return results;
}

function matchesSummaryFilter(
  normalizedFilter: string,
  status: JobStatus | undefined,
): boolean {
  if (normalizedFilter === "total") {
    return true;
  }
  if (normalizedFilter === "progress") {
    return isRunningStatus(status);
  }
  return Boolean(status && status.toLowerCase() === normalizedFilter);
}

function enrichItem(
  target: any,
  statusState?: OperationStatusState,
): OperationViewItem {
  const scriptKeys: OperationScriptKey[] | undefined = Array.isArray(
    target.ScriptKeys,
  )
    ? target.ScriptKeys.map((s: OperationScriptKey) => ({
        ...s,
        requiresFileSelection: getScriptExecutionRequirement(s.key)
          .requiresFileSelection,
      }))
    : target.ScriptKeys;

  const item: OperationViewItem = {
    ...target,
    ScriptKeys: scriptKeys,
    isPdfUpload: isPdfUploadJob(target.kanriNo),
  };

  if (statusState?.status !== undefined) item.status = statusState.status;
  if (statusState?.comment !== undefined) item.comment = statusState.comment;
  if (statusState?.startTime !== undefined)
    item.startTime = statusState.startTime;
  if (statusState?.endTime !== undefined) item.endTime = statusState.endTime;

  return item;
}

export function getOperationTableData(
  mode: "operation" | "irregular" | "today",
): OperationViewItem[] {
  switch (mode) {
    case "operation":
      return getStatusTargetItems("operation");
    case "today":
      return getStatusTargetItems("today");
    case "irregular":
      return getIrregularItems();
  }
}

function getStatusTargetItems(
  targetType: "operation" | "today",
): OperationViewItem[] {
  const results: OperationViewItem[] = [];
  for (const [, target] of statusStore.targets) {
    if (target.targetType !== targetType) {
      continue;
    }
    const statusState = statusStore.statuses.get(target.kanriNo);
    results.push(enrichItem(target, statusState));
  }
  return results;
}

function getIrregularItems(): OperationViewItem[] {
  return statusStore.dependencyMasters.irregularMasters.map((item) =>
    enrichItem(item),
  );
}

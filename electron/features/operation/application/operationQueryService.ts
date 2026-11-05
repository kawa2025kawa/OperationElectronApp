// electron/features/operation/application/operationQueryService.ts

import { isRunningStatus } from "@electron/features/operation/domain/operationRules";
import { getRdpKeysForOperation } from "@electron/features/operation/runners/operationRdpRegistry";
import {
  getScriptExecutionRequirement,
  getScriptKeysForOperation,
  isPdfUploadOperation,
} from "@electron/features/operation/runners/operationScriptRegistry";
import {
  getDependencyMasters,
  getStatuses,
  getTargets,
} from "@electron/features/operation/application/statusManager";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
  type SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";
import type {
  JobStatus,
  OperationRdpKey,
  OperationScriptKey,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

const getWorkName = (workName: string | undefined, kanriNo: string): string =>
  workName || `No.${kanriNo}`;

export function getStatusSummary(): StatusSummary {
  const targets = getTargets();
  const statuses = getStatuses();
  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,
    total: targets.size,
  };

  for (const kanriNo of targets.keys()) {
    const status = statuses.get(kanriNo)?.status;
    if (status && status in summary) {
      summary[status] += 1;
    }
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
  return summary;
}

function matchesSummaryFilter(
  normalizedFilter: string,
  status?: JobStatus,
): boolean {
  if (normalizedFilter === "total") return true;
  if (normalizedFilter === "progress") return isRunningStatus(status);
  return Boolean(status && status.toLowerCase() === normalizedFilter);
}

export function getSummaryDetails(filterKey: string): SummaryDetailRow[] {
  const targets = getTargets();
  const statuses = getStatuses();
  const filter = filterKey.trim().toLowerCase();
  const results: SummaryDetailRow[] = [];

  for (const target of targets.values()) {
    const state = statuses.get(target.kanriNo);
    if (!matchesSummaryFilter(filter, state?.status)) continue;

    results.push({
      kanriNo: target.kanriNo,
      workName: getWorkName(target.workName, target.kanriNo),
      status: state?.status,
      comment: state?.comment ?? undefined,
      ...("jobId" in target && target.jobId !== undefined
        ? { jobId: String(target.jobId) }
        : {}),
    });
  }

  return results;
}

function enrichItem(
  target: OperationViewItem,
  statusState?: OperationStatusState,
): OperationViewItem {
  const rawScriptKeys = getScriptKeysForOperation(
    target.kanriNo,
    target.ScriptKeys,
  );

  const scriptKeys: OperationScriptKey[] = rawScriptKeys.map((k) => ({
    ...k,
    requiresFileSelection: getScriptExecutionRequirement(k.key)
      .requiresFileSelection,
  }));

  const rdpKeys: OperationRdpKey[] = [
    ...getRdpKeysForOperation(target.kanriNo, target.RdpKeys),
  ];

  return {
    ...target,
    workName: getWorkName(target.workName, target.kanriNo),
    ScriptKeys: scriptKeys,
    RdpKeys: rdpKeys,
    isPdfUpload: isPdfUploadOperation(target.kanriNo, rawScriptKeys),
    ...(statusState?.status !== undefined && { status: statusState.status }),
    ...(statusState?.comment !== undefined && { comment: statusState.comment }),
    ...(statusState?.startTime !== undefined && {
      startTime: statusState.startTime,
    }),
    ...(statusState?.endTime !== undefined && { endTime: statusState.endTime }),
  };
}

export function getOperationTableData(mode: ViewMode): OperationViewItem[] {
  if (mode === "irregular") {
    return getDependencyMasters().irregularMasters.map((item) =>
      enrichItem(item),
    );
  }

  const targets = getTargets();
  const statuses = getStatuses();
  const results: OperationViewItem[] = [];

  for (const target of targets.values()) {
    if (target.targetType === mode) {
      results.push(enrichItem(target, statuses.get(target.kanriNo)));
    }
  }

  return results;
}

// electron/features/operation/application/operationQueryService.ts

import {
  getRdpKeysForOperation,
  getScriptExecutionRequirement,
  getScriptKeysForOperation,
  isPdfUploadOperation,
} from "@electron/features/operation/runners/scriptRunner";
import {
  getDependencyMasters,
  getStatuses,
  getTargets,
} from "@electron/features/operation/application/statusManager";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";
import type {
  OperationScriptKey,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

function getWorkName(workName: string | undefined, kanriNo: string): string {
  return workName?.trim() || `No.${kanriNo}`;
}

export function getStatusSummary(): StatusSummary {
  const targets = getTargets();
  const statuses = getStatuses();

  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,
    total: targets.size,
  };

  for (const [kanriNo] of targets) {
    const status = statuses.get(kanriNo)?.status;
    if (!status || !(status in summary)) continue;
    summary[status] += 1;
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}

function enrichItem(
  target: OperationViewItem,
  statusState?: OperationStatusState,
): OperationViewItem {
  const rawScriptKeys = getScriptKeysForOperation(
    target.kanriNo,
    target.ScriptKeys,
    target.workType,
  );

  const scriptKeys: OperationScriptKey[] = rawScriptKeys.map((scriptKey) => ({
    ...scriptKey,
    requiresFileSelection: getScriptExecutionRequirement(scriptKey.key)
      .requiresFileSelection,
  }));

  const rdpKeys = getRdpKeysForOperation(target.kanriNo, target.RdpKeys);

  return {
    ...target,
    kanriNo: target.kanriNo.trim(),
    workName: getWorkName(target.workName, target.kanriNo),
    ScriptKeys: scriptKeys,
    RdpKeys: [...rdpKeys],
    isPdfUpload: isPdfUploadOperation(target.kanriNo, rawScriptKeys),
    status: statusState?.status ?? target.status,
    comment: statusState?.comment ?? target.comment ?? null,
    startTime: statusState?.startTime ?? target.startTime ?? null,
    endTime: statusState?.endTime ?? target.endTime ?? null,
  };
}

function getStatusTargetItems(
  targetType: "operation" | "today",
): OperationViewItem[] {
  const targets = getTargets();
  const statuses = getStatuses();
  const results: OperationViewItem[] = [];

  for (const [, target] of targets) {
    if (target.targetType === targetType) {
      results.push(enrichItem(target, statuses.get(target.kanriNo)));
    }
  }

  return results;
}

export function getOperationTableData(mode: ViewMode): OperationViewItem[] {
  switch (mode) {
    case "operation":
      return getStatusTargetItems("operation");
    case "today":
      return getStatusTargetItems("today");
    case "irregular":
      return getDependencyMasters().irregularMasters.map((item) =>
        enrichItem(item),
      );
  }
}

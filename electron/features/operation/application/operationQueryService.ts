// electron/features/operation/application/operationQueryService.ts

import { isRunningStatus } from "@electron/features/operation/domain/operationRules";
import {
  getScriptExecutionRequirement,
  getScriptKeysForOperation,
  isPdfUploadOperation,
} from "@electron/features/operation/runners/operationScriptRegistry";
import { getRdpKeysForOperation } from "@electron/features/operation/runners/operationRdpRegistry";
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
  OperationScriptKey,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

// 作業名が未設定の場合の代替表示値を取得する。
function getWorkName(workName: string | undefined, kanriNo: string): string {
  return workName?.trim() || `No.${kanriNo}`;
}

// 全ターゲットのステータスを集計し、サマリーデータを算出する。
export function getStatusSummary(): StatusSummary {
  const targets = getTargets();
  const statuses = getStatuses();

  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,
    total: targets.size,
  };

  for (const [kanriNo] of targets) {
    const status = statuses.get(kanriNo)?.status;

    if (!status || !(status in summary)) {
      continue;
    }

    summary[status] += 1;
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}

// サマリーフィルターとステータスの一致を判定する。
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

// 指定されたフィルター条件に合致するステータス詳細行を取得する。
export function getSummaryDetails(filterKey: string): SummaryDetailRow[] {
  const targets = getTargets();
  const statuses = getStatuses();
  const normalizedFilter = filterKey.trim().toLowerCase();

  const results: SummaryDetailRow[] = [];

  for (const [, target] of targets) {
    const statusState = statuses.get(target.kanriNo);
    const currentStatus = statusState?.status;

    if (!matchesSummaryFilter(normalizedFilter, currentStatus)) {
      continue;
    }

    results.push({
      kanriNo: target.kanriNo,
      workName: getWorkName(target.workName, target.kanriNo),
      status: currentStatus,
      comment: statusState?.comment ?? undefined,
      ...("jobId" in target && target.jobId !== undefined
        ? { jobId: String(target.jobId).trim() }
        : {}),
    });
  }

  return results;
}

// ターゲット情報に最新ステータスと実行要件を付与してUI表示用に整形する。
function enrichItem(
  target: OperationViewItem,
  statusState?: OperationStatusState,
): OperationViewItem {
  const rawScriptKeys = getScriptKeysForOperation(
    target.kanriNo,
    target.ScriptKeys,
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

// 指定ターゲット種別のアイテム一覧を最新ステータスと結合して取得する。
function getStatusTargetItems(
  targetType: "operation" | "today",
): OperationViewItem[] {
  const targets = getTargets();
  const statuses = getStatuses();

  const results: OperationViewItem[] = [];

  for (const [, target] of targets) {
    if (target.targetType !== targetType) {
      continue;
    }

    results.push(enrichItem(target, statuses.get(target.kanriNo)));
  }

  return results;
}

// 不定期運用マスタ一覧をUI表示用に整形する。
function getIrregularItems(): OperationViewItem[] {
  return getDependencyMasters().irregularMasters.map((item) =>
    enrichItem(item),
  );
}

// 表示モードに応じた運用テーブル行データ一覧を取得する。
export function getOperationTableData(mode: ViewMode): OperationViewItem[] {
  switch (mode) {
    case "operation":
      return getStatusTargetItems("operation");

    case "today":
      return getStatusTargetItems("today");

    case "irregular":
      return getIrregularItems();
  }
}

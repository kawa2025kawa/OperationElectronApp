// electron/features/operation/application/operationQueryService.ts

import { isPdfUploadJob } from "@electron/features/operation/domain/operationRules";
import { isRunningStatus } from "@electron/features/operation/domain/statusRules";
import { getScriptExecutionRequirement } from "./scriptExecutionRequirements";
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

// 全ターゲットのステータスを集計し、サマリーデータ（各件数・進捗率）を算出する。
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

// 指定されたフィルター条件に合致するステータス詳細行一覧を取得する。
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

    const row: SummaryDetailRow = {
      kanriNo: target.kanriNo,
      workName: target.workName || `No.${target.kanriNo}`,
      status: currentStatus,
      comment: statusState?.comment ?? undefined,
      ...("jobId" in target && target.jobId !== undefined
        ? { jobId: String(target.jobId) }
        : {}),
    };

    results.push(row);
  }

  return results;
}

// フィルター名（total/progress/各ステータス）とステータス値の一致を判定する。
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

// ターゲット情報に最新ステータスと実行要件を付与してUI表示用アイテムに整形する。
function enrichItem(
  target: OperationViewItem,
  statusState?: OperationStatusState,
): OperationViewItem {
  const scriptKeys: OperationScriptKey[] | undefined = Array.isArray(
    target.ScriptKeys,
  )
    ? target.ScriptKeys.map((scriptKey) => ({
        ...scriptKey,
        requiresFileSelection: getScriptExecutionRequirement(scriptKey.key)
          .requiresFileSelection,
      }))
    : target.ScriptKeys;

  return {
    ...target,
    ScriptKeys: scriptKeys,
    isPdfUpload: isPdfUploadJob(target.kanriNo),
    ...(statusState?.status !== undefined && { status: statusState.status }),
    ...(statusState?.comment !== undefined && { comment: statusState.comment }),
    ...(statusState?.startTime !== undefined && {
      startTime: statusState.startTime,
    }),
    ...(statusState?.endTime !== undefined && { endTime: statusState.endTime }),
  };
}

// 表示モードに応じた運用テーブル行データ一覧を取得して返す。
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

// 指定ターゲット種別のアイテム一覧を最新ステータスを結合して取得する。
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

    const statusState = statuses.get(target.kanriNo);
    results.push(enrichItem(target, statusState));
  }

  return results;
}

// 不定期運用マスタ一覧を取得してUI表示用アイテムに整形する。
function getIrregularItems(): OperationViewItem[] {
  return getDependencyMasters().irregularMasters.map((item) =>
    enrichItem(item),
  );
}

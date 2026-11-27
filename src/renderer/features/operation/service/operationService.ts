// src/renderer/features/operation/service/operationService.ts

import { toast } from "sonner";
import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  WORK_TYPE,
  type ActiveFlags,
  type JobResult,
  type JobStatus,
  type OperationViewItem,
  type OperationWorkType,
} from "@shared/types/operation/operationTypes";
import { normalizeKanriNo } from "@shared/utils/sharedUtils";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import {
  invokeIpc,
  rdpIpcService,
  systemIpcService,
} from "@renderer/services/ipcServices";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { toErrorMessage } from "@renderer/utils/rendererUtils";

interface ExecuteScriptParams {
  kanriNo: string;
  scriptKey?: string;
  targetName?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
  onSuccess?: () => void | Promise<void>;
}

interface ExecuteJcJobOptions {
  jobId?: string;
  workType?: OperationWorkType;
  onSuccess?: () => void | Promise<void>;
}

interface UpdateJobStatusParams {
  kanriNo: string;
  status: JobStatus;
  comment?: string;
}

const MANUAL_DECISION_JOB_IDS = new Set<string>(["ZCM8010"]);
const inFlightJcJobs = new Set<string>();
const manualExecutionCounts = new Map<string, number>();

function beginManualExecution(kanriNo: string): void {
  const nextCount = (manualExecutionCounts.get(kanriNo) ?? 0) + 1;
  manualExecutionCounts.set(kanriNo, nextCount);
  if (nextCount === 1) {
    usePollingToastStore.getState().addManualExecuting(kanriNo);
  }
}

function endManualExecution(kanriNo: string): void {
  const currentCount = manualExecutionCounts.get(kanriNo) ?? 0;
  if (currentCount <= 1) {
    manualExecutionCounts.delete(kanriNo);
    usePollingToastStore.getState().removeManualExecuting(kanriNo);
  } else {
    manualExecutionCounts.set(kanriNo, currentCount - 1);
  }
}

/** ジョブ実行時のエラーをトースト通知し、エラーを再送出する */
async function withJobErrorToast<T>(
  errorPrefix: string,
  execute: () => Promise<T>,
): Promise<T> {
  try {
    return await execute();
  } catch (error) {
    toast.error(`${errorPrefix}: ${toErrorMessage(error)}`);
    throw error;
  }
}

/**
- Operation 関連の IPC 通信およびジョブ実行オーケストレーションを集約するサービス
 */
export const operationService = {
  // ==========================================================================
  // 通信 API
  // ==========================================================================

  getTableData: (mode: ViewMode): Promise<OperationViewItem[]> =>
    invokeIpc(IPC_CHANNELS.OPERATION.GET_TABLE_DATA, { mode }),

  updateJobStatus: (params: UpdateJobStatusParams): Promise<void> =>
    invokeIpc(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
      kanriNo: normalizeKanriNo(params.kanriNo),
      status: params.status,
      comment: params.comment ?? "",
    }),

  resetStatuses: () => invokeIpc(IPC_CHANNELS.OPERATION.RESET_STATUSES),

  getActiveFlags: () => invokeIpc(IPC_CHANNELS.OPERATION.GET_ACTIVE_FLAGS),

  setActiveFlags: (flags: Partial<ActiveFlags>) =>
    invokeIpc(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, flags),

  startPolling: () => invokeIpc(IPC_CHANNELS.OPERATION.START_POLLING),

  stopPolling: () => invokeIpc(IPC_CHANNELS.OPERATION.STOP_POLLING),

  getStatusSummary: () =>
    invokeIpc(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY),

  registerTargets: () => invokeIpc(IPC_CHANNELS.OPERATION.REGISTER_TARGETS),

  initializeStatus: () =>
    invokeIpc(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS),

  previewStatusSyncFromSheet: () =>
    invokeIpc(IPC_CHANNELS.OPERATION.PREVIEW_STATUS_SYNC_FROM_SHEET),

  saveStatusesToSheet: (params: {
    operatorName?: string;
    handoverNote: string;
  }) => invokeIpc(IPC_CHANNELS.OPERATION.SAVE_STATUSES_TO_SHEET, params),

  loadStatusesFromSheet: () =>
    invokeIpc(IPC_CHANNELS.OPERATION.LOAD_STATUSES_FROM_SHEET),

  // ==========================================================================
  // ジョブ実行・外部連携オーケストレーション
  // ==========================================================================

  /** JC ジョブのステータス取得・反映を実行する */
  executeJcJob: async (
    kanriNoInput: string,
    options?: ExecuteJcJobOptions,
  ): Promise<void> => {
    const kanriNo = normalizeKanriNo(kanriNoInput);
    if (!kanriNo || inFlightJcJobs.has(kanriNo)) {
      return;
    }

    const normalizedJobId = options?.jobId?.trim().toUpperCase();
    const targetLabel = options?.jobId?.trim() || kanriNo;
    const isManualDecision =
      options?.workType === WORK_TYPE.MANUAL ||
      Boolean(normalizedJobId && MANUAL_DECISION_JOB_IDS.has(normalizedJobId));

    inFlightJcJobs.add(kanriNo);

    try {
      await runJobWithGlobalProcessing("JC 実行中...", targetLabel, () =>
        withJobErrorToast("JC 実行エラー", async () => {
          const result = await invokeIpc(
            IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
            { kanriNo },
          );

          if (!result) {
            throw new Error(`No.${kanriNo} のステータス取得に失敗しました`);
          }

          await options?.onSuccess?.();

          toast.info(
            isManualDecision
              ? `No.${kanriNo} 実行時刻を取得しました（ステータスは手動で更新してください）`
              : `No.${kanriNo} JCステータスを更新しました`,
          );
        }),
      );
    } finally {
      inFlightJcJobs.delete(kanriNo);
    }
  },

  /** スクリプトジョブを実行し、結果を返す */
  executeScriptJob: async (params: ExecuteScriptParams): Promise<JobResult> => {
    const kanriNo = normalizeKanriNo(params.kanriNo);
    const scriptKey = params.scriptKey?.trim() || kanriNo;
    const targetLabel = params.targetName?.trim() || scriptKey;

    beginManualExecution(kanriNo);

    try {
      return await runJobWithGlobalProcessing(
        "処理実行中...",
        targetLabel,
        () =>
          withJobErrorToast("実行エラー", async () => {
            const result = await invokeIpc(
              IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
              {
                kanriNo,
                scriptKey,
                filePath: params.filePath,
                ignoreDependencies: params.ignoreDependencies,
              },
            );

            await params.onSuccess?.();
            return result;
          }),
      );
    } finally {
      endManualExecution(kanriNo);
    }
  },

  /** 指定キーの RDP セッションを開始する */
  startRdpSession: (sessionKey: string): Promise<void> =>
    withJobErrorToast("RDP起動エラー", async () => {
      await rdpIpcService.startSession(sessionKey);
    }),

  /** 指定ターゲットのマニュアルを開く */
  openManual: (target: string, isAuto = false): Promise<void> =>
    withJobErrorToast("マニュアル起動エラー", async () => {
      await systemIpcService.openManual(target, isAuto);
    }),

  /** 外部 URL またはローカルパスを既定アプリケーションで開く */
  openExternal: (
    urlOrPath: string,
    errorPrefix = "外部リンク起動エラー",
  ): Promise<void> =>
    systemIpcService.openExternalWithToast(urlOrPath, errorPrefix),
};

// src/renderer/features/operation/service/operationService.ts

import { toast } from "sonner";
import {
  IPC_CHANNELS,
  type IpcChannelMap,
} from "@shared/types/electron/ipcTypes";
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
import { rdpIpcService } from "@renderer/services/ipcServices";
import { systemIpcService } from "@renderer/services/ipcServices";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { toErrorMessage } from "@renderer/utils/rendererUtils";

export interface ExecuteScriptParams {
  kanriNo: string;
  scriptKey?: string;
  targetName?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
  onSuccess?: () => void | Promise<void>;
}

export interface ExecuteJcJobOptions {
  jobId?: string;
  workType?: OperationWorkType;
  onSuccess?: () => void | Promise<void>;
}

export interface UpdateJobStatusParams {
  kanriNo: string;
  status: JobStatus;
  comment?: string;
}

const MANUAL_DECISION_JOB_IDS = new Set<string>(["ZCM8010"]);

function invokeOperation<K extends keyof IpcChannelMap>(
  channel: K,
  ...args: IpcChannelMap[K]["args"]
): Promise<IpcChannelMap[K]["return"]> {
  return window.electronAPI.invoke(channel, ...args);
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
 * Operation 関連の IPC 通信およびジョブ実行オーケストレーションを集約するサービス
 */
export const operationService = {
  // ==========================================================================
  // 通信 API
  // ==========================================================================

  getTableData: (mode: ViewMode): Promise<OperationViewItem[]> =>
    invokeOperation(IPC_CHANNELS.OPERATION.GET_TABLE_DATA, { mode }),

  updateJobStatus: (params: UpdateJobStatusParams): Promise<void> =>
    invokeOperation(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
      kanriNo: normalizeKanriNo(params.kanriNo),
      status: params.status,
      comment: params.comment ?? "",
    }),

  resetStatuses: () => invokeOperation(IPC_CHANNELS.OPERATION.RESET_STATUSES),

  getActiveFlags: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.GET_ACTIVE_FLAGS),

  setActiveFlags: (flags: Partial<ActiveFlags>) =>
    invokeOperation(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, flags),

  startPolling: () => invokeOperation(IPC_CHANNELS.OPERATION.START_POLLING),

  stopPolling: () => invokeOperation(IPC_CHANNELS.OPERATION.STOP_POLLING),

  getStatusSummary: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY),

  registerTargets: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.REGISTER_TARGETS),

  initializeStatus: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS),

  previewStatusSyncFromSheet: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.PREVIEW_STATUS_SYNC_FROM_SHEET),

  saveStatusesToSheet: (params: {
    operatorName?: string;
    handoverNote: string;
  }) =>
    invokeOperation(IPC_CHANNELS.OPERATION.SAVE_STATUSES_TO_SHEET, params),

  loadStatusesFromSheet: () =>
    invokeOperation(IPC_CHANNELS.OPERATION.LOAD_STATUSES_FROM_SHEET),

  // ==========================================================================
  // ジョブ実行・外部連携オーケストレーション
  // ==========================================================================

  /** JC ジョブのステータス取得・反映を実行する */
  executeJcJob: async (
    kanriNoInput: string,
    options?: ExecuteJcJobOptions,
  ): Promise<void> => {
    const kanriNo = normalizeKanriNo(kanriNoInput);
    const normalizedJobId = options?.jobId?.trim().toUpperCase();
    const targetLabel = options?.jobId?.trim() || kanriNo;
    const isManualDecision =
      options?.workType === WORK_TYPE.MANUAL ||
      Boolean(normalizedJobId && MANUAL_DECISION_JOB_IDS.has(normalizedJobId));

    await runJobWithGlobalProcessing("JC 実行中...", targetLabel, () =>
      withJobErrorToast("JC 実行エラー", async () => {
        const result = await invokeOperation(
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
  },

  /** スクリプトジョブを実行し、結果を返す */
  executeScriptJob: async (params: ExecuteScriptParams): Promise<JobResult> => {
    const kanriNo = normalizeKanriNo(params.kanriNo);
    const scriptKey = params.scriptKey?.trim() || kanriNo;
    const targetLabel = params.targetName?.trim() || scriptKey;
    const toastStore = usePollingToastStore.getState();

    toastStore.addManualExecuting(kanriNo);

    try {
      return await runJobWithGlobalProcessing(
        "処理実行中...",
        targetLabel,
        () =>
          withJobErrorToast("実行エラー", async () => {
            const result = await invokeOperation(
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
      toastStore.removeManualExecuting(kanriNo);
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

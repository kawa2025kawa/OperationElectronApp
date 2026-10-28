// src/renderer/features/operation/operationService.ts

import { toast } from "sonner";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type {
  StatusSummary,
  SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";
import { useAppStore } from "@renderer/store";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";

export interface ExecuteScriptParams {
  kanriNo: string;
  scriptKey?: string;
  targetName?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
}

export interface UpdateJobStatusParams {
  kanriNo: string;
  status: JobStatus;
  comment?: string;
}

/** ジョブ実行時のエラーをトースト通知し、エラーを再送出する */
async function withJobErrorToast<T>(
  errorPrefix: string,
  execute: () => Promise<T>,
): Promise<T> {
  try {
    return await execute();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toast.error(`${errorPrefix}: ${message}`);
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

  /** 指定モードに応じた運用テーブル行データを取得する */
  getTableData: (mode: ViewMode): Promise<OperationViewItem[]> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.GET_TABLE_DATA, { mode }),

  /** ジョブのステータス更新を要求する */
  updateJobStatus: (params: UpdateJobStatusParams): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
      kanriNo: params.kanriNo.trim(),
      status: params.status,
      comment: params.comment ?? "",
    }),

  /** 全ステータスを初期化しマスターを再読み込みする */
  resetStatuses: (): Promise<Record<string, OperationStatusState>> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.RESET_STATUSES),

  /** センターフラグを設定する */
  setActiveFlags: (flags: Partial<ActiveFlags>): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, flags),

  /** 定期ポーリングを開始する */
  startPolling: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.START_POLLING),

  /** 定期ポーリングを停止する */
  stopPolling: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.STOP_POLLING),

  /** ステータス集計サマリーを取得する */
  getStatusSummary: (): Promise<StatusSummary> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY),

  /** フィルター条件別のサマリー詳細一覧を取得する */
  getSummaryDetails: (filterKey: string): Promise<SummaryDetailRow[]> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS, {
      filterKey,
    }),

  /** JSONマスターから作業ターゲットを登録する */
  registerTargets: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.REGISTER_TARGETS),

  /** 保存済みステータスを復元する */
  initializeStatus: (): Promise<Record<string, OperationStatusState>> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS),

  // ==========================================================================
  // ジョブ実行オーケストレーション
  // ==========================================================================

  /** JC ジョブのステータス取得・反映を実行する */
  executeJcJob: async (kanriNoInput: string): Promise<void> => {
    const kanriNo = kanriNoInput.trim();

    await runJobWithGlobalProcessing("JC 実行中...", kanriNo, () =>
      withJobErrorToast("JC 実行エラー", async () => {
        const result = await window.electronAPI.invoke(
          IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
          { kanriNo },
        );

        if (!result) {
          throw new Error(`No.${kanriNo} のステータス取得に失敗しました`);
        }

        const store = useAppStore.getState();
        await store.fetchTableData(store.currentMode);

        toast.info(`No.${kanriNo} JCステータスを更新しました`);
      }),
    );
  },

  /** スクリプトジョブを実行し、結果を返す */
  executeScriptJob: async (params: ExecuteScriptParams): Promise<JobResult> => {
    const kanriNo = params.kanriNo.trim();
    const scriptKey = params.scriptKey?.trim() || kanriNo;
    const targetLabel = params.targetName || scriptKey;

    return runJobWithGlobalProcessing("処理実行中...", targetLabel, () =>
      withJobErrorToast("実行エラー", async () => {
        const result = await window.electronAPI.invoke(
          IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
          {
            kanriNo,
            scriptKey,
            filePath: params.filePath,
            ignoreDependencies: params.ignoreDependencies,
          },
        );

        const store = useAppStore.getState();
        await store.fetchTableData(store.currentMode);

        return result;
      }),
    );
  },
};

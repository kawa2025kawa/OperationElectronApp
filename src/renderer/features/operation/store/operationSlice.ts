// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import type { JobResult, OperationItem } from "@shared/types/operation";
import type { StatusSummary } from "@shared/types/ui";

import {
  buildInitialOperationData,
  evaluateDependenciesCascade,
  findEntityByKanriNo,
  INITIAL_SUMMARY,
  resetAllEntityStatuses,
  updateEntityInState,
} from "@renderer/features/operation/helpers/operationEntities";

import {
  executeJcJob,
  executeScriptJob,
  filterSummaryItems,
  refreshSummary,
  type ScriptFilePath,
} from "@renderer/features/operation/services/operationServices";

/* ============================================================================
 * Types
 * ========================================================================== */

export interface OperationSlice {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  operationIds: string[];
  operationEntities: Record<string, OperationItem>;

  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;

  todayIds: string[];

  summary: StatusSummary;

  // --------------------------------------------------------------------------
  // Selectors
  // --------------------------------------------------------------------------

  getEntityByKanriNo: (kanriNo: string | number) => OperationItem | undefined;

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  setInitialRawData: (
    operations: OperationItem[],
    irregulars: OperationItem[],
    statuses: Record<string, OperationItem>,
  ) => void;

  // --------------------------------------------------------------------------
  // Entity / Status
  // --------------------------------------------------------------------------

  updateItemStatus: (update: OperationItem) => void;

  updateJobStatus: (params: {
    kanriNo: string;
    status: OperationItem["status"];
    comment?: string;
  }) => Promise<void>;

  resetAllOperationStatuses: () => Promise<void>;

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------

  recalculateSummary: () => void;

  getFilteredSummaryItems: (label: string) => OperationItem[];

  // --------------------------------------------------------------------------
  // Job Execution
  // --------------------------------------------------------------------------

  runScriptJob: (
    kanriNo: string,
    filePath?: ScriptFilePath,
  ) => Promise<JobResult>;

  runJcJob: (kanriNo: string) => Promise<void>;
}

/* ============================================================================
 * Slice
 * ========================================================================== */

export const createOperationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationSlice
> = (set, get) => {
  /* ==========================================================================
   * Internal Helpers
   * ======================================================================== */

  /**
   * Storeから指定管理No.に対応するOperationItemを取得する。
   */
  const getOperationItem = (
    kanriNo: string | number,
  ): OperationItem | undefined => {
    return findEntityByKanriNo(get(), kanriNo);
  };

  /**
   * OperationItemを更新し、依存関係の再評価・Summaryの再計算を行う。
   *
   * Entity更新、連鎖判定、Summary更新を同一transaction内で行う。
   */
  const updateItemAndRefreshSummary = (update: OperationItem): boolean => {
    let updated = false;

    set((state: AppState) => {
      const result = updateEntityInState(state, update);

      if (!result.updated) {
        return;
      }

      // 親ジョブの状態変化に伴い、依存する子ジョブを即座に再評価 (waiting -> ready 等)
      evaluateDependenciesCascade(state);

      updated = true;
      refreshSummary(state);
    });

    return updated;
  };

  /**
   * 現在のOperationItemにStatus変更を適用する。
   *
   * 対象Itemが存在しない場合は何もしない。
   */
  const updateCurrentItemStatus = (
    kanriNo: string,
    status: OperationItem["status"],
    comment?: string,
  ): void => {
    const currentItem = getOperationItem(kanriNo);

    if (!currentItem) {
      return;
    }

    updateItemAndRefreshSummary({
      ...currentItem,
      status,
      comment: comment ?? currentItem.comment ?? "",
    });
  };

  /* ==========================================================================
   * Slice State
   * ======================================================================== */

  return {
    // ------------------------------------------------------------------------
    // Initial State
    // ------------------------------------------------------------------------

    operationIds: [],
    operationEntities: {},

    irregularIds: [],
    irregularEntities: {},

    todayIds: [],

    summary: INITIAL_SUMMARY,

    // ------------------------------------------------------------------------
    // Selectors
    // ------------------------------------------------------------------------

    getEntityByKanriNo: (kanriNo) => getOperationItem(kanriNo),

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------

    setInitialRawData: (operations, irregulars, statuses): void => {
      set((state: AppState) => {
        const initialData = buildInitialOperationData(
          operations,
          irregulars,
          statuses,
        );

        Object.assign(state, initialData);

        // 初期ロード時にも依存関係を一括評価
        evaluateDependenciesCascade(state);

        refreshSummary(state);
      });
    },

    // ------------------------------------------------------------------------
    // Entity / Status
    // ------------------------------------------------------------------------

    updateItemStatus: (update): void => {
      updateItemAndRefreshSummary(update);
    },

    updateJobStatus: async ({ kanriNo, status, comment }): Promise<void> => {
      if (!status) {
        return;
      }

      /*
       * Renderer側の状態を先に更新する。
       *
       * IPC失敗時にもUI上の状態を保持し、
       * Main側への同期失敗のみをログへ記録する。
       */
      updateCurrentItemStatus(kanriNo, status, comment);

      try {
        await commands.updateJobStatus(kanriNo, status, comment);
      } catch (error) {
        console.error(
          `[OperationSlice] Failed to update job status: ${kanriNo}`,
          error,
        );
      }
    },

    resetAllOperationStatuses: async (): Promise<void> => {
      await commands.deleteAllJobStatuses();

      set((state: AppState) => {
        resetAllEntityStatuses(state);
        refreshSummary(state);
      });
    },

    // ------------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------------

    recalculateSummary: (): void => {
      set((state: AppState) => {
        refreshSummary(state);
      });
    },

    getFilteredSummaryItems: (label): OperationItem[] => {
      return filterSummaryItems(get(), label);
    },

    // ------------------------------------------------------------------------
    // Job Execution
    // ------------------------------------------------------------------------

    /**
     * Script Jobを実行する。
     *
     * 実行処理・依存関係チェック・IPC通信は
     * operationServicesへ委譲する。
     *
     * SliceではExecutionResultの内容を解釈しない。
     */
    runScriptJob: (kanriNo, filePath): Promise<JobResult> => {
      return executeScriptJob(get(), kanriNo, filePath);
    },

    /**
     * JC Jobを実行する。
     *
     * JC固有の処理はoperationServicesへ委譲する。
     */
    runJcJob: (kanriNo): Promise<void> => {
      return executeJcJob(get(), kanriNo);
    },
  };
};

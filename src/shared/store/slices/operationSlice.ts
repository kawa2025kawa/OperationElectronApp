// src/shared/store/slices/operationSlice.ts

import type { StateCreator } from "zustand";

import type { AppState } from "@shared/store";
import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";

import { commands } from "@shared/api/commands";
import { isIrregularToday } from "@shared/utils/isIrregularToday";

import {
  calculateSummary,
  INITIAL_SUMMARY,
  mapRawEntities,
} from "./helpers/operationSummary";

import {
  getAllEntities,
  findEntityByKanriNo,
} from "./helpers/operationEntities";

import {
  checkJobDependencies,
  getDependentKanriNos,
} from "./helpers/dependencyHelper";

import { mergeStatus } from "./helpers/statusFactory";
import { applyPersistedStatuses } from "./helpers/persistedStatus";
import { resetAllEntityStatuses } from "./helpers/resetOperationStatus";

import { jcService } from "./services/jcService";
import { scriptService } from "./services/scriptService";

// ============================================================
// Types
// ============================================================

export interface OperationSlice {
  operationIds: string[];
  operationEntities: Record<string, OperationItem>;

  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;

  todayIds: string[];

  summary: StatusSummary;

  jobDependencies: JobDependenciesJson | null;

  setInitialRawData: (
    operations: OperationItem[],
    irregulars: OperationItem[],
    statuses: Record<string, OperationItem>,
    jobDependencies?: JobDependenciesJson | null,
  ) => void;

  updateItemStatus: (update: OperationItem) => void;

  updateJobStatus: (params: {
    kanriNo: string;
    status: OperationItem["status"];
    comment?: string;
  }) => Promise<void>;

  recalculateSummary: () => void;

  resetAllOperationStatuses: () => Promise<void>;

  runScriptJob: (kanriNo: string) => Promise<void>;

  runJcJob: (kanriNo: string) => Promise<void>;
}

// ============================================================
// Helpers
// ============================================================

const refreshSummary = (state: AppState): void => {
  state.summary = calculateSummary(getAllEntities(state));
};

const getOperationContext = (state: AppState) => ({
  entities: getAllEntities(state),
  dependencies: state.jobDependencies,
  updateStatus: state.updateItemStatus,
});

/**
 * Status変更後に依存関係を再評価する。
 *
 * 例:
 *
 * 57 -> N21 -> N31
 *
 * 57 が success
 *   ↓
 * N21 を ready
 *   ↓
 * N31 を再評価
 *
 * というように依存関係を下流へ伝播させる。
 */
const refreshDependentStatuses = (
  state: AppState,
  changedKanriNo: string,
): void => {
  if (!state.jobDependencies) {
    return;
  }

  const queue: string[] = [String(changedKanriNo)];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const currentKanriNo = queue.shift();

    if (!currentKanriNo) {
      continue;
    }

    if (processed.has(currentKanriNo)) {
      continue;
    }

    processed.add(currentKanriNo);

    const dependentKanriNos = getDependentKanriNos(
      currentKanriNo,
      state.jobDependencies,
    );

    for (const dependentKanriNo of dependentKanriNos) {
      const dependentEntity = findEntityByKanriNo(state, dependentKanriNo);

      if (!dependentEntity) {
        continue;
      }

      const dependencyResult = checkJobDependencies(
        dependentKanriNo,
        getAllEntities(state),
        state.jobDependencies,
      );

      const currentStatus = dependentEntity.status;

      /**
       * 依存関係によって自動制御するのは
       * waiting / ready のJOBだけ。
       *
       * 実行中・完了・エラーのJOBを
       * 依存関係チェックだけで上書きしない。
       */
      if (currentStatus !== "waiting" && currentStatus !== "ready") {
        continue;
      }

      const nextStatus = dependencyResult.ok ? "ready" : "waiting";

      if (currentStatus === nextStatus) {
        continue;
      }

      dependentEntity.status = nextStatus;

      /**
       * このJOB自身のStatusが変わったので、
       * さらに下流の依存JOBも再評価する。
       */
      queue.push(dependentKanriNo);
    }
  }
};

// ============================================================
// Slice
// ============================================================

export const createOperationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationSlice
> = (set, get) => ({
  operationIds: [],
  operationEntities: {},

  irregularIds: [],
  irregularEntities: {},

  todayIds: [],

  summary: INITIAL_SUMMARY,

  jobDependencies: null,

  setInitialRawData: (
    operations,
    irregulars,
    statuses,
    jobDependencies = null,
  ) =>
    set((state) => {
      state.operationIds = operations.map(({ kanriNo }) => String(kanriNo));

      state.operationEntities = applyPersistedStatuses(
        mapRawEntities(operations),
        statuses,
      );

      state.irregularIds = irregulars.map(({ kanriNo }) => String(kanriNo));

      state.irregularEntities = applyPersistedStatuses(
        mapRawEntities(irregulars),
        statuses,
      );

      state.todayIds = irregulars
        .filter(isIrregularToday)
        .map(({ kanriNo }) => String(kanriNo));

      state.jobDependencies = jobDependencies;

      refreshSummary(state);
    }),

  /**
   * Status更新の唯一の入口。
   *
   * ここでStatusが実際に変わった場合、
   * そのJOBを参照している依存JOBを再評価する。
   */
  updateItemStatus: (update) =>
    set((state) => {
      const kanriNo = String(update.kanriNo);

      let updated = false;
      let statusChanged = false;

      for (const entities of [
        state.operationEntities,
        state.irregularEntities,
      ]) {
        const entity = entities[kanriNo];

        if (!entity) {
          continue;
        }

        const previousStatus = entity.status;

        mergeStatus(entity, update);

        updated = true;

        if (previousStatus !== entity.status) {
          statusChanged = true;
        }
      }

      if (!updated) {
        return;
      }

      /**
       * Statusが変わった場合だけ依存関係を再評価する。
       */
      if (statusChanged) {
        refreshDependentStatuses(state, kanriNo);
      }

      refreshSummary(state);
    }),

  updateJobStatus: async ({ kanriNo, status, comment }) => {
    await commands.updateJobStatus(kanriNo, status, comment);
  },

  recalculateSummary: () =>
    set((state) => {
      refreshSummary(state);
    }),

  resetAllOperationStatuses: async () => {
    await commands.deleteAllJobStatuses();

    set((state) => {
      resetAllEntityStatuses(state);
      refreshSummary(state);
    });
  },

  runScriptJob: async (kanriNo) => {
    const state = get();

    const target = findEntityByKanriNo(state, kanriNo);

    state.setGlobalProcessing(
      true,
      "スクリプト実行中...",
      target?.workName ?? null,
    );

    try {
      const context = getOperationContext(state);

      await scriptService.executeScript(
        kanriNo,
        context.entities,
        context.dependencies,
        context.updateStatus,
      );
    } finally {
      state.setGlobalProcessing(false);
    }
  },

  runJcJob: async (kanriNo) => {
    const state = get();

    const target = findEntityByKanriNo(state, kanriNo);

    state.setGlobalProcessing(true, "JC処理中...", target?.jobId ?? null);

    try {
      const context = getOperationContext(state);

      await jcService.executeJcJob(
        kanriNo,
        context.entities,
        context.dependencies,
        context.updateStatus,
      );
    } finally {
      state.setGlobalProcessing(false);
    }
  },
});

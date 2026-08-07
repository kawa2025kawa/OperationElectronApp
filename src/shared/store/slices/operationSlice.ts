// src/shared/store/slices/operationSlice.ts

import type { StateCreator } from "zustand";

import type { AppState } from "@shared/store";
import type { StatusSummary } from "@shared/types/uiType";
import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";

import { isIrregularToday } from "@shared/utils/isIrregularToday";

import {
  INITIAL_SUMMARY,
  calculateSummary,
  mapRawEntities,
} from "./helpers/operationSummary";

import { csvService, type ImportCsvResult } from "./services/csvService";
import { externalService } from "./services/externalService";
import { jcService } from "./services/jcService";
import { scriptService } from "./services/scriptService";
import {
  statusService,
  type UpdateJobStatusParams,
} from "./services/statusService";

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

  recalculateSummary: () => void;

  refreshJobStatus: (kanriNo: string) => Promise<unknown>;

  updateJobStatus: (params: UpdateJobStatusParams) => Promise<void>;

  resetAllOperationStatuses: () => Promise<void>;

  runScriptJob: (kanriNo: string) => Promise<void>;

  runJcJob: (kanriNo: string) => Promise<void>;

  openExternalLink: (url: string) => Promise<void>;

  importCsv: (files: File[]) => Promise<ImportCsvResult[]>;
}

const mergeString = (
  next?: string | null,
  current?: string | null,
): string | null => (next && next.trim() !== "" ? next : (current ?? null));

const updateSummary = (state: AppState): void => {
  state.summary = calculateSummary({
    ...state.operationEntities,
    ...state.irregularEntities,
  });
};

const updateEntityStatus = (
  entity: OperationItem,
  update: OperationItem,
): void => {
  entity.status = update.status ?? entity.status ?? "scheduled";

  if (update.comment != null) {
    entity.comment =
      update.comment.trim() !== "" ? update.comment : (entity.comment ?? "");
  }

  entity.startTime = mergeString(update.startTime, entity.startTime);

  entity.endTime = mergeString(update.endTime, entity.endTime);

  entity.expectedStartTime = mergeString(
    update.expectedStartTime,
    entity.expectedStartTime,
  );

  entity.expectedEndTime = mergeString(
    update.expectedEndTime,
    entity.expectedEndTime,
  );

  if (update.substatus?.length) {
    entity.substatus = update.substatus;
  }
};

const getAllEntities = (state: AppState): Record<string, OperationItem> => ({
  ...state.operationEntities,
  ...state.irregularEntities,
});

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

      state.operationEntities = mapRawEntities(operations, statuses);

      state.irregularIds = irregulars.map(({ kanriNo }) => String(kanriNo));

      state.irregularEntities = mapRawEntities(irregulars, statuses);

      state.todayIds = irregulars
        .filter(isIrregularToday)
        .map(({ kanriNo }) => String(kanriNo));

      state.jobDependencies = jobDependencies;

      updateSummary(state);
    }),

  updateItemStatus: (update) =>
    set((state) => {
      const id = String(update.kanriNo);

      let updated = false;

      for (const entities of [
        state.operationEntities,
        state.irregularEntities,
      ]) {
        const entity = entities[id];

        if (!entity) {
          continue;
        }

        updateEntityStatus(entity, update);

        updated = true;
      }

      if (updated) {
        updateSummary(state);
      }
    }),

  recalculateSummary: () => set(updateSummary),

  refreshJobStatus: (kanriNo) => jcService.refreshJobStatus(kanriNo),

  updateJobStatus: (params) => statusService.updateJobStatus(params),

  resetAllOperationStatuses: async () => {
    await statusService.resetAllStatuses();

    set((state) => {
      state.operationEntities = mapRawEntities(
        Object.values(state.operationEntities),
        {},
      );

      state.irregularEntities = mapRawEntities(
        Object.values(state.irregularEntities),
        {},
      );

      updateSummary(state);
    });
  },

  runScriptJob: async (kanriNo) => {
    const state = get();

    await scriptService.executeScript(
      kanriNo,
      getAllEntities(state),
      state.jobDependencies,
      state.updateItemStatus,
    );
  },

  runJcJob: async (kanriNo) => {
    const state = get();

    await jcService.executeJcJob(
      kanriNo,
      getAllEntities(state),
      state.jobDependencies,
      state.updateItemStatus,
    );
  },

  openExternalLink: (url) => externalService.openExternalLink(url),

  importCsv: (files) => csvService.importCsv(files),
});

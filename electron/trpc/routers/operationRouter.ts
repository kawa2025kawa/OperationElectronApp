import { z } from "zod";
import { setActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/application/operationScheduler";
import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionStatus";
import {
  deleteAllStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  refreshDependencyStatuses,
  registerTargets,
  resetAllStatusesToScheduled,
  updateManualStatus,
  updateStatus,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { runScriptWithZipRecovery } from "@electron/features/operation/infrastructure/recovery/zipRecoveryHelper";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import { clearMasterDataCache } from "@electron/features/spreadsheet/application/masterDataManager";
import { getStatusSummary } from "@electron/features/operation/application/statusManager";
import { publicProcedure, router } from "@electron/trpc/trpc";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";

export const operationRouter = router({
  resetStatuses: publicProcedure.mutation(async () => {
    const result = resetAllStatusesToScheduled();
    await clearMasterDataCache();
    return result;
  }),

  setActiveFlags: publicProcedure
    .input(
      z.object({
        is1CActive: z.boolean().optional(),
        is2CActive: z.boolean().optional(),
        is3CActive: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      setActiveFlags(input);
      refreshDependencyStatuses();
    }),

  deleteAllStatuses: publicProcedure.mutation(async () => {
    await deleteAllStatuses();
  }),

  initializeStatus: publicProcedure.mutation(async () => {
    return initializeStatuses();
  }),

  getStatusSummary: publicProcedure.query(() => {
    return getStatusSummary();
  }),

  registerTargets: publicProcedure
    .input(z.object({ masterData: z.custom<MasterData>() }))
    .mutation(({ input }) => {
      const { masterData } = input;
      const targets = [
        ...masterData.operations.map((target) => ({
          ...target,
          targetType: "operation" as const,
        })),
        ...masterData.todayIrregulars.map((target) => ({
          ...target,
          targetType: "today" as const,
        })),
      ];
      registerTargets(targets, masterData);
    }),

  updateJobStatus: publicProcedure
    .input(
      z.object({
        kanriNo: z.string(),
        status: z.nativeEnum(JOB_STATUS),
        comment: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const kanriNo = normalizeKanriNo(input.kanriNo);
      updateManualStatus(
        kanriNo,
        input.status as JobStatus,
        input.comment ?? "",
      );
    }),

  startPolling: publicProcedure.mutation(() => {
    startPolling();
  }),

  stopPolling: publicProcedure.mutation(() => {
    stopPolling();
  }),

  executeScript: publicProcedure
    .input(
      z.object({
        kanriNo: z.string(),
        scriptKey: z.string().optional(),
        filePath: z.union([z.string(), z.array(z.string())]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const kanriNo = normalizeKanriNo(input.kanriNo);
      const scriptKey = input.scriptKey?.trim()
        ? input.scriptKey.trim()
        : kanriNo;
      try {
        const result = await runScriptWithZipRecovery(
          kanriNo,
          scriptKey,
          input.filePath,
        );
        applyScriptExecutionResult(kanriNo, result);
        return result;
      } catch (error) {
        applyScriptExecutionError(kanriNo, error);
        throw error;
      }
    }),

  fetchSingleStatus: publicProcedure
    .input(z.object({ kanriNo: z.string() }))
    .mutation(async ({ input }) => {
      const kanriNo = normalizeKanriNo(input.kanriNo);
      const target = getTargetByKanriNo(kanriNo);
      if (!target || target.targetType !== "operation" || !target.jobId) {
        throw new Error(`Tracker target not found (kanriNo=${kanriNo})`);
      }
      const trackerStatus = await fetchTrackerStatusByJobId(
        target.jobId,
        target.scheduledTime,
        target.kanriNo,
      );
      if (!trackerStatus) {
        return {
          kanriNo,
          status: undefined,
          comment: "Trackerデータなし",
        };
      }
      updateStatus(trackerStatus);
      return trackerStatus;
    }),
});

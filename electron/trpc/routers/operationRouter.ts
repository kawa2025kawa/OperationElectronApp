// electron/trpc/routers/operationRouter.ts

import { z } from "zod";
import {
  getActiveFlags,
  setActiveFlags,
} from "@electron/features/operation/application/activeFlagsManager";
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
  getDependencyMasters,
  getDependencyStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  refreshDependencyStatuses,
  registerTargets,
  resetAllStatusesToScheduled,
  updateManualStatus,
  updateStatus,
} from "@electron/features/operation/application/statusManager";
import {
  getOperationTableData,
  getStatusSummary,
  getSummaryDetails,
} from "@electron/features/operation/application/operationQueryService";
import {
  clearJsonMasterDataCache,
  getJsonMasterData,
} from "@electron/features/masterData/application/jsonMasterDataManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { runScriptWithZipRecovery } from "@electron/features/operation/infrastructure/recovery/zipRecoveryHelper";
import { isValidTrackerJobId } from "@electron/features/operation/infrastructure/tracker/trackerHelper";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import { publicProcedure, router } from "@electron/trpc/trpc";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import { checkJobDependencies } from "@shared/utils/dependency/dependencyUtils";

export const operationRouter = router({
  /* ==========================================================================
   * Query (参照・取得系)
   * ========================================================================== */
  getStatusSummary: publicProcedure.query(() => {
    return getStatusSummary();
  }),

  getSummaryDetails: publicProcedure
    .input(z.object({ filterKey: z.string() }))
    .query(({ input }) => {
      return getSummaryDetails(input.filterKey);
    }),

  getTableData: publicProcedure
    .input(z.object({ mode: z.enum(["operation", "irregular", "today"]) }))
    .query(({ input }) => {
      return getOperationTableData(input.mode);
    }),

  /* ==========================================================================
   * Command (更新・操作系)
   * ========================================================================== */
  resetStatuses: publicProcedure.mutation(async () => {
    const result = resetAllStatusesToScheduled();
    await clearJsonMasterDataCache();
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

  registerTargets: publicProcedure.mutation(async () => {
    const masterData = await getJsonMasterData();

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
        ignoreDependencies: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const kanriNo = normalizeKanriNo(input.kanriNo);
      const scriptKey = input.scriptKey?.trim()
        ? input.scriptKey.trim()
        : kanriNo;

      if (!input.ignoreDependencies) {
        const dependencyResult = checkJobDependencies(
          kanriNo,
          getDependencyMasters(),
          getDependencyStatuses(),
          getActiveFlags(),
        );

        if (!dependencyResult.ok) {
          const missingKanriNos = dependencyResult.missingDependencies
            .map(({ kanriNo }) => kanriNo)
            .filter(Boolean);

          const message =
            missingKanriNos.length > 0
              ? `未完了前作業 (No.${missingKanriNos.join(", ")})`
              : "未完了前作業あり";

          updateManualStatus(kanriNo, JOB_STATUS.ERROR, message);
          throw new Error(message);
        }
      }

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

      if (
        !target ||
        target.targetType !== "operation" ||
        !isValidTrackerJobId(target.jobId)
      ) {
        throw new Error(
          `Tracker target not found or Job ID is not configured (kanriNo=${kanriNo})`,
        );
      }

      const trackerStatus = await fetchTrackerStatusByJobId(
        target.jobId.trim(),
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

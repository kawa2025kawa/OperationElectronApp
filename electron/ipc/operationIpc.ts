// electron/ipc/operationIpc.ts

import {
  getOperationTableData,
  getStatusSummary,
} from "@electron/features/operation/application/operationQueryService";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/application/operationScheduler";
import { fetchSingleTrackerStatus } from "@electron/features/operation/application/operationStatusEvaluator";
import {
  executeManualScript,
  getScriptExecutionRequirement,
} from "@electron/features/operation/application/scriptExecutionService";
import {
  deleteAllStatuses,
  ensureOperationInitialized,
  getActiveFlags,
  initializeStatuses,
  registerOperationTargets,
  resetOperationStatuses,
  updateManualStatus,
  updateOperationActiveFlags,
} from "@electron/features/operation/application/statusManager";
import {
  loadStatusesFromSpreadsheet,
  previewStatusSyncFromSpreadsheet,
  saveStatusesToSpreadsheet,
} from "@electron/features/operation/application/statusSheetSyncService";
import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import { registerIpcHandler } from "./index";

export function registerOperationIpc(): void {
  // Query / Master
  registerIpcHandler(IPC_CHANNELS.OPERATION.GET_ACTIVE_FLAGS, async () => {
    await ensureOperationInitialized();
    return getActiveFlags();
  });
  registerIpcHandler(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY, async () => {
    await ensureOperationInitialized();
    return getStatusSummary();
  });
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.GET_TABLE_DATA,
    async ({ mode }) => {
      await ensureOperationInitialized();
      return getOperationTableData(mode);
    },
  );
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT,
    ({ scriptKey }) => getScriptExecutionRequirement(scriptKey),
  );

  // Status Lifecycle / Mutation
  registerIpcHandler(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS, () =>
    initializeStatuses(),
  );
  registerIpcHandler(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, () =>
    registerOperationTargets(),
  );
  registerIpcHandler(IPC_CHANNELS.OPERATION.RESET_STATUSES, () =>
    resetOperationStatuses(),
  );
  registerIpcHandler(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES, () =>
    deleteAllStatuses(),
  );
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS,
    async (input) => {
      await ensureOperationInitialized();
      const flags = "flags" in input ? input.flags : input;
      updateOperationActiveFlags(flags);
    },
  );
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS,
    async (input) => {
      await ensureOperationInitialized();
      updateManualStatus(input.kanriNo, input.status, input.comment ?? "");
    },
  );

  // Polling / Execution
  registerIpcHandler(IPC_CHANNELS.OPERATION.START_POLLING, async () => {
    await ensureOperationInitialized();
    startPolling();
  });
  registerIpcHandler(IPC_CHANNELS.OPERATION.STOP_POLLING, () => stopPolling());
  registerIpcHandler(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, async (input) => {
    await ensureOperationInitialized();
    return executeManualScript(input);
  });
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    async ({ kanriNo }) => {
      await ensureOperationInitialized();
      return fetchSingleTrackerStatus(kanriNo);
    },
  );

  // Spreadsheet Status Sync (Save / Load)
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.SAVE_STATUSES_TO_SHEET,
    async (input) => {
      await ensureOperationInitialized();
      return saveStatusesToSpreadsheet(input);
    },
  );
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.PREVIEW_STATUS_SYNC_FROM_SHEET,
    () => previewStatusSyncFromSpreadsheet(),
  );
  registerIpcHandler(
    IPC_CHANNELS.OPERATION.LOAD_STATUSES_FROM_SHEET,
    async () => {
      stopPolling();
      await ensureOperationInitialized();
      return loadStatusesFromSpreadsheet();
    },
  );
}
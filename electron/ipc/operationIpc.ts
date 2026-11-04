// electron/ipc/operationIpc.ts

import {
  getOperationTableData,
  getStatusSummary,
  getSummaryDetails,
} from "@electron/features/operation/application/operationQueryService";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/application/operationScheduler";
import {
  executeManualScript,
  getScriptExecutionRequirement,
} from "@electron/features/operation/application/scriptExecutionService";
import {
  deleteAllStatuses,
  getActiveFlags,
  initializeStatuses,
  registerOperationTargets,
  resetOperationStatuses,
  updateManualStatus,
  updateOperationActiveFlags,
} from "@electron/features/operation/application/statusManager";
import { fetchSingleTrackerStatus } from "@electron/features/operation/application/operationStatusEvaluator";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { registerIpcHandler } from "./ipcHelper";

export function registerOperationIpc(): void {
  registerIpcHandler(IPC_CHANNELS.OPERATION.GET_ACTIVE_FLAGS, () =>
    getActiveFlags(),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY, () =>
    getStatusSummary(),
  );

  registerIpcHandler(
    IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS,
    ({ filterKey }) => getSummaryDetails(filterKey),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.GET_TABLE_DATA, ({ mode }) =>
    getOperationTableData(mode),
  );

  registerIpcHandler(
    IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT,
    ({ scriptKey }) => getScriptExecutionRequirement(scriptKey),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.RESET_STATUSES, async () => {
    stopPolling();
    return resetOperationStatuses();
  });

  registerIpcHandler(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, async (input) => {
    const flags = "flags" in input ? input.flags : input;
    await updateOperationActiveFlags(flags);
  });

  registerIpcHandler(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES, () =>
    deleteAllStatuses(),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS, () =>
    initializeStatuses(),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, () =>
    registerOperationTargets(),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, (input) => {
    updateManualStatus(input.kanriNo, input.status, input.comment ?? "");
  });

  registerIpcHandler(IPC_CHANNELS.OPERATION.START_POLLING, () =>
    startPolling(),
  );

  registerIpcHandler(IPC_CHANNELS.OPERATION.STOP_POLLING, () => stopPolling());

  registerIpcHandler(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, (input) =>
    executeManualScript(input),
  );

  registerIpcHandler(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    ({ kanriNo }) => fetchSingleTrackerStatus(kanriNo),
  );
}

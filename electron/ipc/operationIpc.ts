// electron/ipc/operationIpc.ts

import { ipcMain } from "electron";
import {
  getOperationTableData,
  getStatusSummary,
  getSummaryDetails,
} from "@electron/features/operation/application/operationQueryService";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/application/operationScheduler";
import { getScriptExecutionRequirement } from "@electron/features/operation/application/scriptExecutionRequirements";
import {
  registerOperationTargets,
  resetOperationStatuses,
  updateOperationActiveFlags,
  updateOperationJobStatus,
} from "@electron/features/operation/application/operationCommandService";
import { executeManualScript } from "@electron/features/operation/application/scriptExecutionService";
import { fetchSingleTrackerStatus } from "@electron/features/operation/application/trackerStatusService";
import {
  deleteAllStatuses,
  initializeStatuses,
} from "@electron/features/operation/application/statusManager";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { ActiveFlags } from "@shared/types/operation/operationTypes";
import type { JobStatus } from "@shared/types/operation/operationTypes";

export function registerOperationIpc(): void {
  ipcMain.handle(IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY, () => {
    return getStatusSummary();
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS,
    (_event, { filterKey }: { filterKey: string }) => {
      return getSummaryDetails(filterKey);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_TABLE_DATA,
    (_event, { mode }: { mode: "operation" | "irregular" | "today" }) => {
      return getOperationTableData(mode);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT,
    (_event, { scriptKey }: { scriptKey: string }) => {
      return getScriptExecutionRequirement(scriptKey);
    },
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.RESET_STATUSES, async () => {
    return resetOperationStatuses();
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS,
    (_event, { flags }: { flags: Partial<ActiveFlags> }) => {
      updateOperationActiveFlags(flags);
    },
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES, async () => {
    await deleteAllStatuses();
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS, () => {
    return initializeStatuses();
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, async () => {
    await registerOperationTargets();
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS,
    (
      _event,
      input: {
        kanriNo: string;
        status: JobStatus;
        comment?: string;
      },
    ) => {
      updateOperationJobStatus(input);
    },
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.START_POLLING, () => {
    startPolling();
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.STOP_POLLING, () => {
    stopPolling();
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
    (
      _event,
      input: {
        kanriNo: string;
        scriptKey?: string;
        filePath?: string | string[];
        ignoreDependencies?: boolean;
      },
    ) => {
      return executeManualScript(input);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    (_event, { kanriNo }: { kanriNo: string }) => {
      return fetchSingleTrackerStatus(kanriNo);
    },
  );
}

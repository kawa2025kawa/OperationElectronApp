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
  deleteAllStatuses,
  initializeStatuses,
  updateManualStatus,
  updateOperationActiveFlags,
} from "@electron/features/operation/application/statusManager";
import {
  registerOperationTargets,
  resetOperationStatuses,
} from "@electron/features/operation/application/operationLifecycleService";
import { executeManualScript } from "@electron/features/operation/application/scriptExecutionService";
import { fetchSingleTrackerStatus } from "@electron/features/operation/application/operationStatusEvaluator";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

export function registerOperationIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY,
    (): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY]["return"] => {
      return getStatusSummary();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS,
    (
      _event,
      {
        filterKey,
      }: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS]["args"][0],
    ): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS]["return"] => {
      return getSummaryDetails(filterKey);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_TABLE_DATA,
    (
      _event,
      {
        mode,
      }: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_TABLE_DATA]["args"][0],
    ): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_TABLE_DATA]["return"] => {
      return getOperationTableData(mode);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT,
    (
      _event,
      {
        scriptKey,
      }: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT]["args"][0],
    ): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT]["return"] => {
      return getScriptExecutionRequirement(scriptKey);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.RESET_STATUSES,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.RESET_STATUSES]["return"]
    > => {
      return resetOperationStatuses();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS,
    (
      _event,
      input: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS]["args"][0],
    ): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS]["return"] => {
      if ("flags" in input) {
        updateOperationActiveFlags(input.flags);
      } else {
        updateOperationActiveFlags(input);
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES]["return"]
    > => {
      await deleteAllStatuses();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.INITIALIZE_STATUS,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.INITIALIZE_STATUS]["return"]
    > => {
      return await initializeStatuses();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.REGISTER_TARGETS,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.REGISTER_TARGETS]["return"]
    > => {
      await registerOperationTargets();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS,
    (
      _event,
      input: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS]["args"][0],
    ): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS]["return"] => {
      updateManualStatus(input.kanriNo, input.status, input.comment ?? "");
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.START_POLLING,
    (): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.START_POLLING]["return"] => {
      startPolling();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.STOP_POLLING,
    (): IpcChannelMap[typeof IPC_CHANNELS.OPERATION.STOP_POLLING]["return"] => {
      stopPolling();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
    async (
      _event,
      input: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT]["return"]
    > => {
      return executeManualScript(input);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    async (
      _event,
      {
        kanriNo,
      }: IpcChannelMap[typeof IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS]["return"]
    > => {
      return fetchSingleTrackerStatus(kanriNo);
    },
  );
}

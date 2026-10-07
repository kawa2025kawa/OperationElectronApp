// electron\features\operation\ipc\operationIpc.ts

import { ipcMain } from "electron";

import { setActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { runScriptWithZipRecovery } from "@electron/features/operation/infrastructure/recovery/zipRecoveryHelper";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/application/operationScheduler";

import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionStatus";

import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
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
import { clearMasterDataCache } from "@electron/features/spreadsheet/application/masterDataManager";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import type {
  MasterData,
  OperationMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

let registered = false;

function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    Object.values(JOB_STATUS).includes(value as JobStatus)
  );
}

function getRequiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return normalizeKanriNo(value);
}

function isOperationMaster(target: unknown): target is OperationMaster {
  if (typeof target !== "object" || target === null) {
    return false;
  }

  const data = target as Record<string, unknown>;

  return typeof data.jobId === "string" && data.jobId.trim().length > 0;
}

function isMasterData(value: unknown): value is MasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    Array.isArray(data.operations) &&
    Array.isArray(data.irregulars) &&
    Array.isArray(data.todayIrregulars)
  );
}

function isRecordWithMasterData(value: unknown): value is {
  masterData: MasterData;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const args = value as Record<string, unknown>;

  return isMasterData(args.masterData);
}

async function fetchSingleStatus(
  kanriNo: string,
): Promise<OperationStatusState> {
  const target = getTargetByKanriNo(kanriNo);

  if (!target || !isOperationMaster(target)) {
    throw new Error(`Target not found or invalid (kanriNo=${kanriNo})`);
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
      comment: "Tracker未取得",
    };
  }

  updateStatus(trackerStatus);

  return trackerStatus;
}

function handleRegisterTargets(args: unknown): void {
  if (!isRecordWithMasterData(args)) {
    throw new Error("Invalid operation master data");
  }

  const { masterData } = args;

  console.log("[OperationIPC] REGISTER_TARGETS:", {
    operations: masterData.operations.length,
    irregulars: masterData.irregulars.length,
    todayIrregulars: masterData.todayIrregulars.length,
  });

  registerTargets(
    [
      ...masterData.operations,
      ...masterData.irregulars,
      ...masterData.todayIrregulars,
    ],
    masterData,
  );
}

export function registerOperationIpc(): void {
  if (registered) {
    return;
  }

  registered = true;

  ipcMain.handle(IPC_CHANNELS.OPERATION.RESET_STATUSES, async () => {
    const result = resetAllStatusesToScheduled();

    await clearMasterDataCache();

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, (_event, flags) => {
    setActiveFlags(flags);

    refreshDependencyStatuses();
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES, () =>
    deleteAllStatuses(),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS, () =>
    initializeStatuses(),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, (_event, args) =>
    handleRegisterTargets(args),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, (_event, args) => {
    const kanriNo = getRequiredString(args?.kanriNo, "kanriNo is required");

    if (!isJobStatus(args?.status)) {
      throw new Error("Invalid job status");
    }

    const comment = typeof args?.comment === "string" ? args.comment : "";

    updateManualStatus(kanriNo, args.status, comment);
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.START_POLLING, () => startPolling());

  ipcMain.handle(IPC_CHANNELS.OPERATION.STOP_POLLING, () => stopPolling());

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
    async (_event, args) => {
      const kanriNo = getRequiredString(args?.kanriNo, "kanriNo is required");

      const scriptKey =
        typeof args?.scriptKey === "string" && args.scriptKey.trim()
          ? args.scriptKey.trim()
          : kanriNo;

      try {
        const result = await runScriptWithZipRecovery(
          kanriNo,
          scriptKey,
          args?.filePath,
        );

        applyScriptExecutionResult(kanriNo, result);

        return result;
      } catch (error) {
        applyScriptExecutionError(kanriNo, error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    async (_event, args) => {
      const kanriNo = getRequiredString(args?.kanriNo, "kanriNo is required");

      return fetchSingleStatus(kanriNo);
    },
  );
}

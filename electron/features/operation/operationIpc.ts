// electron/features/operation/operationIpc.ts

import { ipcMain } from "electron";

import { setActiveFlags } from "@electron/features/operation/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/helpers/operationUtils";
import { runScriptWithZipRecovery } from "@electron/features/operation/helpers/zipRecoveryHelper";
import { saveMasterCache } from "@electron/features/operation/services/operationMasterService";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/services/operationScheduler";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/services/trackerServiceClient";
import {
  deleteAllStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  refreshDependencyStatuses,
  registerTargets,
  resetAllStatusesToScheduled,
  updateManualStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import type {
  OperationMaster,
  OperationMasterData,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * State & Helpers
 * ========================= */

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

function isOperationMasterData(value: unknown): value is OperationMasterData {
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
  masterData: OperationMasterData;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const args = value as Record<string, unknown>;

  return isOperationMasterData(args.masterData);
}

/* =========================
 * Status Fetching
 * ========================= */

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

/* =========================
 * Handlers
 * ========================= */

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

  saveMasterCache(masterData);

  registerTargets([
    ...masterData.operations,
    ...masterData.irregulars,
    ...masterData.todayIrregulars,
  ]);
}

/* =========================
 * IPC Registration
 * ========================= */

export function registerOperationIpc(): void {
  if (registered) {
    return;
  }

  registered = true;

  ipcMain.handle(IPC_CHANNELS.OPERATION.RESET_STATUSES, () =>
    resetAllStatusesToScheduled(),
  );

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

  ipcMain.handle(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, (_event, args) => {
    const kanriNo = getRequiredString(
      args?.scriptId ?? args?.kanriNo,
      "kanriNo (scriptId) is required",
    );

    const scriptKey =
      typeof args?.scriptKey === "string" && args.scriptKey
        ? args.scriptKey
        : kanriNo;

    return runScriptWithZipRecovery(kanriNo, scriptKey, args?.filePath);
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    async (_event, args) => {
      const kanriNo = getRequiredString(args?.kanriNo, "kanriNo is required");

      return fetchSingleStatus(kanriNo);
    },
  );
}

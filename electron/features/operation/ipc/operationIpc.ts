// electron/features/operation/ipc/operationIpc.ts

import { ipcMain } from "electron";

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
import {
  executeSingleScriptJob,
  type ScriptFilePath,
} from "@electron/features/operation/runners/scriptRunner";
import { clearMasterDataCache } from "@electron/features/spreadsheet/application/masterDataManager";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";

import type { StatusTarget } from "../application/statusNotifier";

type IpcArgs = Record<string, unknown>;

type OperationTarget = Extract<StatusTarget, { targetType: "operation" }>;

let registered = false;

function isRecord(value: unknown): value is IpcArgs {
  return typeof value === "object" && value !== null;
}

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

function hasTrackerTarget(
  target: StatusTarget | undefined,
): target is OperationTarget {
  return (
    target?.targetType === "operation" &&
    typeof target.jobId === "string" &&
    target.jobId.trim().length > 0
  );
}

function isMasterData(value: unknown): value is MasterData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.operations) &&
    Array.isArray(value.irregulars) &&
    Array.isArray(value.todayIrregulars)
  );
}

function getMasterDataFromArgs(value: unknown): MasterData {
  if (!isRecord(value) || !isMasterData(value.masterData)) {
    throw new Error("Invalid operation master data");
  }

  return value.masterData;
}

function createStatusTargets(masterData: MasterData): StatusTarget[] {
  return [
    ...masterData.operations.map((target) => ({
      ...target,
      targetType: "operation" as const,
    })),
    ...masterData.todayIrregulars.map((target) => ({
      ...target,
      targetType: "today" as const,
    })),
  ];
}

function isActiveFlags(
  value: unknown,
): value is Partial<ActiveFlags> | undefined {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, flag]) =>
      (key === "is1CActive" || key === "is2CActive" || key === "is3CActive") &&
      typeof flag === "boolean",
  );
}

function getActiveFlagsFromArgs(
  value: unknown,
): Partial<ActiveFlags> | undefined {
  if (!isRecord(value)) {
    throw new Error("Invalid active flags");
  }

  if (!isActiveFlags(value.flags)) {
    throw new Error("Invalid active flags");
  }

  return value.flags;
}

function isScriptFilePath(value: unknown): value is ScriptFilePath {
  if (typeof value === "string") {
    return true;
  }

  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function getScriptFilePath(value: unknown): ScriptFilePath | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isScriptFilePath(value)) {
    throw new Error("Invalid script file path");
  }

  return value;
}

async function fetchSingleStatus(
  kanriNo: string,
): Promise<OperationStatusState> {
  const target = getTargetByKanriNo(kanriNo);

  if (!hasTrackerTarget(target)) {
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
      comment: "Tracker未取得",
    };
  }

  updateStatus(trackerStatus);

  return trackerStatus;
}

function handleRegisterTargets(args: unknown): void {
  const masterData = getMasterDataFromArgs(args);
  const targets = createStatusTargets(masterData);

  registerTargets(targets, masterData);
}

function handleSetActiveFlags(args: unknown): void {
  const flags = getActiveFlagsFromArgs(args);

  setActiveFlags(flags);
  refreshDependencyStatuses();
}

function handleUpdateJobStatus(args: unknown): void {
  if (!isRecord(args)) {
    throw new Error("Invalid job status arguments");
  }

  const kanriNo = getRequiredString(args.kanriNo, "kanriNo is required");

  if (!isJobStatus(args.status)) {
    throw new Error("Invalid job status");
  }

  const comment = typeof args.comment === "string" ? args.comment : "";

  updateManualStatus(kanriNo, args.status, comment);
}

async function handleExecuteScript(
  args: unknown,
): Promise<Awaited<ReturnType<typeof executeSingleScriptJob>>> {
  if (!isRecord(args)) {
    throw new Error("Invalid execute script arguments");
  }

  const kanriNo = getRequiredString(args.kanriNo, "kanriNo is required");

  const scriptKey =
    typeof args.scriptKey === "string" && args.scriptKey.trim()
      ? args.scriptKey.trim()
      : kanriNo;

  const filePath = getScriptFilePath(args.filePath);

  try {
    const result = await runScriptWithZipRecovery(kanriNo, scriptKey, filePath);

    applyScriptExecutionResult(kanriNo, result);

    return result;
  } catch (error) {
    applyScriptExecutionError(kanriNo, error);

    throw error;
  }
}

async function handleFetchSingleStatus(
  args: unknown,
): Promise<OperationStatusState> {
  if (!isRecord(args)) {
    throw new Error("Invalid fetch status arguments");
  }

  const kanriNo = getRequiredString(args.kanriNo, "kanriNo is required");

  return fetchSingleStatus(kanriNo);
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

  ipcMain.handle(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, (_event, args) => {
    handleSetActiveFlags(args);
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES, () =>
    deleteAllStatuses(),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS, () =>
    initializeStatuses(),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, (_event, args) => {
    handleRegisterTargets(args);
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, (_event, args) => {
    handleUpdateJobStatus(args);
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.START_POLLING, () => startPolling());

  ipcMain.handle(IPC_CHANNELS.OPERATION.STOP_POLLING, () => stopPolling());

  ipcMain.handle(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, (_event, args) =>
    handleExecuteScript(args),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS, (_event, args) =>
    handleFetchSingleStatus(args),
  );
}

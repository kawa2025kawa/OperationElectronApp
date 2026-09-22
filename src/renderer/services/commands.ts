// src/renderer/services/commands.ts

import type { AuthSession } from "@shared/types/auth";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationItem,
} from "@shared/types/operation/operationTypes";
import type { RdpTarget } from "@shared/types/rdp";
import type { UpdateInfo } from "@shared/types/system";
import type { OperationMasterCache } from "@electron/features/operation/services/operationMasterService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

/* ============================================================================
 * Types & Type Guards
 * ========================================================================== */
export type ScriptFilePath = string | string[];

export interface CreateGmailDraftParams {
  accessToken: string;
  raw: string;
}

interface OperationStatusUpdatedPayload {
  status?: OperationItem;
}

export type AppTheme = "dark" | "light";

const isOperationStatusUpdatedPayload = (
  payload: unknown,
): payload is OperationStatusUpdatedPayload =>
  typeof payload === "object" && payload !== null && "status" in payload;

const isAppTheme = (value: unknown): value is AppTheme =>
  value === "dark" || value === "light";

/* ============================================================================
 * Commands Adapter
 * ========================================================================== */
export const commands = {
  // Operation / Polling
  startPolling: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.START_POLLING),

  stopPolling: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.STOP_POLLING),

  setActiveFlags: (flags?: Partial<ActiveFlags>): Promise<void> =>
    window.electronAPI.invoke(
      IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS,
      flags ?? {},
    ),

  updateJobStatus: (
    kanriNo: string,
    status: JobStatus,
    comment?: string,
  ): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
      kanriNo,
      status,
      comment,
    }),

  deleteAllJobStatuses: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES),

  resetOperationStatusesFromSpreadsheet: (payload?: {
    operations?: OperationItem[];
    irregulars?: OperationItem[];
    todayIrregulars?: OperationItem[];
  }): Promise<{ success: boolean; data: OperationItem[] }> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.RESET_STATUSES, payload),

  fetchSingleJobStatus: (kanriNo: string): Promise<OperationItem> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS, {
      kanriNo,
    }),

  registerTargets: (items: OperationItem[]): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, {
      items,
    }),

  syncOperationMaster: (payload: {
    operations: OperationItem[];
    irregulars: OperationItem[];
    todayIrregulars: OperationItem[];
  }): Promise<{ success: boolean }> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.SYNC_MASTER, payload),

  loadOperationMasterCache: (): Promise<OperationMasterCache | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.LOAD_MASTER_CACHE),

  initializeStatus: (): Promise<Record<string, OperationItem>> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS),

  // Jobs / Scripts
  executeScript: (
    scriptId: string,
    filePath?: ScriptFilePath,
  ): Promise<JobResult> =>
    window.electronAPI.invoke(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, {
      scriptId,
      filePath,
    }),

  // RDP
  getRdpTargets: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke("getRdpTargets"),

  startRdpSession: (id: string): Promise<void> =>
    window.electronAPI.invoke("startRdpSession", { payload: { id } }),

  // Authentication
  loadAuthSession: (): Promise<AuthSession | null> =>
    window.electronAPI.invoke("googleAuth:loadSession"),

  login: (): Promise<AuthSession> =>
    window.electronAPI.invoke("googleAuth:login"),

  logout: (): Promise<void> => window.electronAPI.invoke("googleAuth:logout"),

  // System / File
  tempomaticUploadDocument: (
    filePaths: string[],
    expireDate: string,
  ): Promise<boolean> =>
    window.electronAPI.invoke("tempomatic:uploadDocument", {
      filePaths,
      expireDate,
    }),

  getFilePath: (file: File): string => window.electronAPI.getFilePath(file),

  openExternal: (urlOrPath: string): Promise<void> =>
    window.electronAPI.invoke("openExternal", { urlOrPath }),

  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    window.electronAPI.invoke("readUpdateInfo"),

  showMainWindow: (): Promise<void> =>
    window.electronAPI.invoke("showMainWindow"),

  showOpenDialog: (options: unknown): Promise<unknown> =>
    window.electronAPI.invoke("showOpenDialog", options),

  // Gmail
  getGmailSignature: (accessToken?: string): Promise<string> =>
    window.electronAPI.invoke("gmail:getSignature", accessToken),

  createGmailDraft: (params: CreateGmailDraftParams): Promise<void> =>
    window.electronAPI.invoke("gmail:createDraft", params),

  // Gift MD
  processGiftMd: (filePath?: ScriptFilePath): Promise<string> =>
    window.electronAPI.invoke("gift-md:process", filePath),

  // Events
  onOperationStatusUpdated: (
    callback: (update: OperationItem) => void,
  ): (() => void) =>
    window.electronAPI.on("operation:status-updated", (payload: unknown) => {
      // payload が { status: item } の場合と、そのまま OperationItem の場合の両方に対応
      if (isOperationStatusUpdatedPayload(payload) && payload.status) {
        callback(payload.status);
      } else if (
        payload &&
        typeof payload === "object" &&
        "kanriNo" in payload
      ) {
        callback(payload as OperationItem);
      }
    }),

  onThemeChanged: (callback: (theme: AppTheme) => void): (() => void) =>
    window.electronAPI.on("theme-changed", (theme: unknown) => {
      if (isAppTheme(theme)) {
        callback(theme);
      }
    }),

  onPollingCycleComplete: (
    callback: (nextPollTime: number) => void,
  ): (() => void) =>
    window.electronAPI.on("polling-cycle-complete", (payload: unknown) => {
      if (typeof payload === "number") {
        callback(payload);
      } else {
        callback(Date.now() + 60000);
      }
    }),
} as const;

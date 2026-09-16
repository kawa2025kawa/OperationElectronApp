// src/renderer/services/commands.ts

import type { AuthSession } from "@shared/types/auth";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationItem,
} from "@shared/types/operation";
import type { RdpTarget } from "@shared/types/rdp";
import type { UpdateInfo } from "@shared/types/system";

/**
 * Renderer → Main IPC の一元管理アダプター。
 */

/* ============================================================================
 * Types
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

/* ============================================================================
 * Type Guards
 * ========================================================================== */

function isOperationStatusUpdatedPayload(
  payload: unknown,
): payload is OperationStatusUpdatedPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return "status" in payload;
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === "dark" || value === "light";
}

/* ============================================================================
 * Commands
 * ========================================================================== */

export const commands = {
  // ========================================================================
  // Operation / Polling
  // ========================================================================

  /**
   * Pollingを開始する。
   */
  startPolling: (): Promise<void> => window.electronAPI.invoke("startPolling"),

  /**
   * Pollingを停止する。
   */
  stopPolling: (): Promise<void> => window.electronAPI.invoke("stopPolling"),

  /**
   * Auto Start対象のActive FlagをMainへ同期する。
   */
  setActiveFlags: (flags?: Partial<ActiveFlags>): Promise<void> =>
    window.electronAPI.invoke("setActiveFlags", flags ?? {}),

  /**
   * Job Statusを更新する。
   */
  updateJobStatus: (
    kanriNo: string,
    status: JobStatus,
    comment?: string,
  ): Promise<void> =>
    window.electronAPI.invoke("updateJobStatus", {
      kanriNo,
      status,
      comment,
    }),

  /**
   * 全Job Statusを削除する。
   */
  deleteAllJobStatuses: (): Promise<void> =>
    window.electronAPI.invoke("deleteAllJobStatuses"),

  /**
   * 単一Jobの最新Statusを取得する。
   */
  fetchSingleJobStatus: (kanriNo: string): Promise<OperationItem> =>
    window.electronAPI.invoke("fetchSingleJobStatus", {
      kanriNo,
    }),

  /**
   * Operation対象をMain側へ登録する。
   */
  registerTargets: (items: OperationItem[]): Promise<void> =>
    window.electronAPI.invoke("registerTargets", { items }),

  /**
   * 初期Statusを取得する。
   */
  initializeStatus: (): Promise<Record<string, OperationItem>> =>
    window.electronAPI.invoke("initializeStatus"),

  // ========================================================================
  // Jobs / Scripts
  // ========================================================================

  /**
   * Script / Jobを実行する。
   */
  executeScript: (
    scriptId: string,
    filePath?: ScriptFilePath,
  ): Promise<JobResult> =>
    window.electronAPI.invoke("executeScript", {
      scriptId,
      filePath,
    }),

  // ========================================================================
  // RDP
  // ========================================================================

  getRdpTargets: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke("getRdpTargets"),

  startRdpSession: (id: string): Promise<void> =>
    window.electronAPI.invoke("startRdpSession", {
      payload: { id },
    }),

  // ========================================================================
  // Authentication
  // ========================================================================

  loadAuthSession: (): Promise<AuthSession | null> =>
    window.electronAPI.invoke("googleAuth:loadSession"),

  login: (): Promise<AuthSession> =>
    window.electronAPI.invoke("googleAuth:login"),

  logout: (): Promise<void> => window.electronAPI.invoke("googleAuth:logout"),

  // ========================================================================
  // System / File
  // ========================================================================

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

  // ========================================================================
  // Gmail
  // ========================================================================

  getGmailSignature: (accessToken?: string): Promise<string> =>
    window.electronAPI.invoke("gmail:getSignature", accessToken),

  createGmailDraft: (params: CreateGmailDraftParams): Promise<void> =>
    window.electronAPI.invoke("gmail:createDraft", params),

  // ========================================================================
  // Gift MD
  // ========================================================================

  processGiftMd: (filePath?: ScriptFilePath): Promise<string> =>
    window.electronAPI.invoke("gift-md:process", filePath),

  // ========================================================================
  // Events
  // ========================================================================

  onOperationStatusUpdated: (
    callback: (update: OperationItem) => void,
  ): (() => void) =>
    window.electronAPI.on("operationStatusUpdated", (payload: unknown) => {
      if (!isOperationStatusUpdatedPayload(payload)) {
        return;
      }

      const { status } = payload;

      if (!status) {
        return;
      }

      callback(status);
    }),

  onThemeChanged: (callback: (theme: AppTheme) => void): (() => void) =>
    window.electronAPI.on("theme-changed", (theme: unknown) => {
      if (!isAppTheme(theme)) {
        return;
      }

      callback(theme);
    }),

  onPollingCycleComplete: (callback: () => void): (() => void) =>
    window.electronAPI.on("polling-cycle-complete", callback),
} as const;

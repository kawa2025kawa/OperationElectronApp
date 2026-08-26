// src/shared/api/commands.ts

import type { AuthSession } from "@shared/types/authTypes";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import type { RdpTarget } from "@shared/types/rdpTypes";
import type { UpdateInfo } from "@shared/types/updateTypes";

export const commands = {
  // Polling & Status Management
  startPolling: (): Promise<void> => window.electronAPI.invoke("startPolling"),

  stopPolling: (): Promise<void> => window.electronAPI.invoke("stopPolling"),

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

  deleteAllJobStatuses: (): Promise<void> =>
    window.electronAPI.invoke("deleteAllJobStatuses"),

  fetchSingleJobStatus: (kanriNo: string): Promise<OperationItem> =>
    window.electronAPI.invoke<OperationItem>("fetchSingleJobStatus", {
      kanriNo,
    }),

  registerTargets: (items: OperationItem[]): Promise<void> =>
    window.electronAPI.invoke("registerTargets", { items }),

  initializeStatus: (): Promise<Record<string, OperationItem>> =>
    window.electronAPI.invoke<Record<string, OperationItem>>(
      "initializeStatus",
    ),

  // Scripts / Jobs (filePath をオプショナル受入可能に拡張)
  executeScript: async (
    scriptId: string,
    filePath?: string | string[],
  ): Promise<string> => {
    const result = await window.electronAPI.invoke<string>("executeScript", {
      scriptId,
      filePath,
    });
    return result ?? "";
  },

  // RDP
  getRdpTargets: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke<RdpTarget[]>("getRdpTargets"),

  startRdpSession: (id: string): Promise<void> =>
    window.electronAPI.invoke("startRdpSession", { payload: { id } }),

  // Auth
  loadAuthSession: (): Promise<AuthSession | null> =>
    window.electronAPI.invoke<AuthSession | null>("googleAuth:loadSession"),

  login: (): Promise<AuthSession> =>
    window.electronAPI.invoke<AuthSession>("googleAuth:login"),

  logout: (): Promise<void> => window.electronAPI.invoke("googleAuth:logout"),

  // System & File Utility
  tempomaticUploadDocument: (
    filePaths: string[],
    expireDate: string,
  ): Promise<boolean> =>
    window.electronAPI.invoke<boolean>("tempomatic:uploadDocument", {
      filePaths,
      expireDate,
    }),

  getFilePath: (file: File): string => window.electronAPI.getFilePath(file),

  openExternal: (urlOrPath: string): Promise<void> =>
    window.electronAPI.invoke("openExternal", { urlOrPath }),

  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    window.electronAPI.invoke<UpdateInfo | null>("readUpdateInfo"),

  showMainWindow: (): Promise<void> =>
    window.electronAPI.invoke("showMainWindow"),

  showOpenDialog: (options: unknown): Promise<unknown> =>
    window.electronAPI.invoke("showOpenDialog", options),

  // Gmail Integrations
  getGmailSignature: (accessToken?: string): Promise<string> =>
    window.electronAPI.invoke("gmail:getSignature", accessToken),

  createGmailDraft: (params: {
    accessToken: string;
    raw: string;
  }): Promise<void> => window.electronAPI.invoke("gmail:createDraft", params),

  // Event Listeners
  onOperationStatusUpdated: (
    callback: (update: OperationItem) => void,
  ): (() => void) => {
    return window.electronAPI.on(
      "operationStatusUpdated",
      (payload: unknown) => {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          return;
        }
        const status = (payload as { status?: OperationItem }).status;
        if (status) {
          callback(status);
        }
      },
    );
  },

  onThemeChanged: (
    callback: (theme: "dark" | "light") => void,
  ): (() => void) => {
    return window.electronAPI.on("theme-changed", (theme: unknown) => {
      if (theme === "dark" || theme === "light") {
        callback(theme);
      }
    });
  },
} as const;

// src/shared/api/commands.ts

import type { AuthSession } from "@shared/types/authTypes";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import type { RdpTarget } from "@shared/types/rdpTypes";
import type { UpdateInfo } from "@shared/types/updateTypes";

export const commands = {
  startPolling: async (): Promise<void> => {
    await window.electronAPI.invoke("startPolling");
  },

  stopPolling: async (): Promise<void> => {
    await window.electronAPI.invoke("stopPolling");
  },

  updateJobStatus: async (
    kanriNo: string,
    status: JobStatus,
    comment?: string,
  ): Promise<void> => {
    await window.electronAPI.invoke("updateJobStatus", {
      kanriNo,
      status,
      comment,
    });
  },

  deleteAllJobStatuses: async (): Promise<void> => {
    await window.electronAPI.invoke("deleteAllJobStatuses");
  },

  fetchSingleJobStatus: async (kanriNo: string): Promise<OperationItem> => {
    return window.electronAPI.invoke<OperationItem>("fetchSingleJobStatus", {
      kanriNo,
    });
  },

  executeScript: async (scriptId: string): Promise<string> => {
    const result = await window.electronAPI.invoke<string>("executeScript", {
      scriptId,
    });

    return result ?? "";
  },

  getRdpTargets: async (): Promise<RdpTarget[]> => {
    return window.electronAPI.invoke<RdpTarget[]>("getRdpTargets");
  },

  startRdpSession: async (id: string): Promise<void> => {
    await window.electronAPI.invoke("startRdpSession", {
      payload: { id },
    });
  },

  loadAuthSession: async (): Promise<AuthSession | null> => {
    return window.electronAPI.invoke<AuthSession | null>(
      "googleAuth:loadSession",
    );
  },

  logout: async (): Promise<void> => {
    await window.electronAPI.invoke("googleAuth:logout");
  },

  login: async (): Promise<AuthSession> => {
    return window.electronAPI.invoke<AuthSession>("googleAuth:login");
  },

  tempomaticUploadDocument: async (
    filePaths: string[],
    expireDate: string,
  ): Promise<boolean> => {
    return window.electronAPI.invoke<boolean>("tempomaticUploadDocument", {
      filePaths,
      expireDate,
    });
  },

  getFilePath: (file: File): string => {
    return window.electronAPI.getFilePath(file);
  },

  openExternal: async (url: string): Promise<void> => {
    await window.electronAPI.openExternal(url);
  },

  readUpdateInfo: async (): Promise<UpdateInfo | null> => {
    return window.electronAPI.invoke<UpdateInfo | null>("readUpdateInfo");
  },

  showWindow: async (): Promise<void> => {
    await window.electronAPI.showWindow();
  },

  showMainWindow: async (): Promise<void> => {
    await window.electronAPI.showWindow();
  },

  registerTargets: async (items: OperationItem[]): Promise<void> => {
    await window.electronAPI.invoke("registerTargets", {
      items,
    });
  },

  initializeStatus: async (): Promise<Record<string, OperationItem>> => {
    return window.electronAPI.invoke<Record<string, OperationItem>>(
      "initializeStatus",
    );
  },

  showOpenDialog: async (options: unknown): Promise<unknown> => {
    return window.electronAPI.showOpenDialog(options);
  },

  getGmailSignature: async (accessToken?: string): Promise<string> => {
    return window.electronAPI.getGmailSignature(accessToken);
  },

  createGmailDraft: async (params: {
    accessToken: string;
    raw: string;
  }): Promise<void> => {
    await window.electronAPI.createGmailDraft(params);
  },

  onOperationStatusUpdated: (
    callback: (update: OperationItem) => void,
  ): (() => void) => {
    return window.electronAPI.on(
      "operationStatusUpdated",
      (...args: unknown[]) => {
        const payload = args[0];

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
    return window.electronAPI.on("theme-changed", (...args: unknown[]) => {
      const theme = args[0];

      if (theme === "dark" || theme === "light") {
        callback(theme);
      }
    });
  },
} as const;

export const loadAuthSession = commands.loadAuthSession;
export const logout = commands.logout;
export const login = commands.login;

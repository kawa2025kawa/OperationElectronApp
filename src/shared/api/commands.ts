//src\shared\api\commands.ts

import type { AuthSession } from "@shared/types/authTypes";
import type { OperationItem, ScriptResult } from "@shared/types/operationType";
import type { RdpTarget } from "@shared/types/rdpTypes";

// =====================================================
// Types
// =====================================================

export type JobStatusResponse = ScriptResult & {
  updatedAt: string;
};

export interface OpenFileDialogOptions {
  properties?: string[];
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

// =====================================================
// System / Status
// =====================================================

export async function initializeStatus(): Promise<
  Record<string, OperationItem>
> {
  return window.electronAPI.invoke<Record<string, OperationItem>>(
    "initializeStatus",
  );
}

export async function updateJobStatus(
  kanriNo: string,
  status: OperationItem["status"],
  comment?: string,
): Promise<void> {
  await window.electronAPI.invoke("updateJobStatus", {
    kanriNo,
    status,
    comment,
  });
}

export async function deleteAllJobStatuses(): Promise<void> {
  await window.electronAPI.invoke("deleteAllJobStatuses");
}

// =====================================================
// Application
// =====================================================

export async function getAppVersion(): Promise<string> {
  return window.electronAPI.invoke<string>("getAppVersion");
}

export async function showMainWindow(): Promise<void> {
  await window.electronAPI.invoke("showMainWindow");
}

export async function quitApp(): Promise<void> {
  await window.electronAPI.invoke("quitApp");
}

// =====================================================
// File Dialog
// =====================================================

export async function showOpenDialog(
  options: OpenFileDialogOptions,
): Promise<string[] | null> {
  return window.electronAPI.invoke<string[] | null>("showOpenDialog", options);
}

// =====================================================
// Operation
// =====================================================

export async function registerTargets(items: OperationItem[]): Promise<void> {
  await window.electronAPI.invoke("registerTargets", {
    items,
  });
}

export async function fetchSingleJobStatus(
  kanriNo: string,
): Promise<JobStatusResponse> {
  return window.electronAPI.invoke<JobStatusResponse>("fetchSingleJobStatus", {
    kanriNo,
  });
}

export async function executeScript(scriptId: string): Promise<string> {
  return window.electronAPI.invoke<string>("executeScript", {
    scriptId,
  });
}

// =====================================================
// Polling
// =====================================================

export async function startPolling(): Promise<void> {
  await window.electronAPI.invoke("startPolling");
}

export async function stopPolling(): Promise<void> {
  await window.electronAPI.invoke("stopPolling");
}

// =====================================================
// Remote Desktop
// =====================================================

export async function getRdpTargets(): Promise<RdpTarget[]> {
  return window.electronAPI.invoke<RdpTarget[]>("getRdpTargets");
}

export async function startRdpSession(id: string): Promise<void> {
  await window.electronAPI.invoke("startRdpSession", {
    payload: {
      id,
    },
  });
}

// =====================================================
// Tempomatic
// =====================================================

export async function tempomaticUploadDocument(
  filePaths: string[],
  expireDate: string,
): Promise<void> {
  await window.electronAPI.invoke("tempomaticUploadDocument", {
    filePaths,
    expireDate,
  });
}

// =====================================================
// Auth
// =====================================================

export async function login(): Promise<AuthSession> {
  return window.electronAPI.invoke<AuthSession>("googleAuth:login");
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  return window.electronAPI.invoke<AuthSession | null>(
    "googleAuth:loadSession",
  );
}

export async function logout(): Promise<void> {
  await window.electronAPI.invoke("googleAuth:logout");
}

export async function openExternal(urlOrPath: string): Promise<void> {
  await window.electronAPI.invoke("openExternal", {
    urlOrPath,
  });
}

// =====================================================
// Command Object
// =====================================================

export const commands = {
  initializeStatus,
  updateJobStatus,
  deleteAllJobStatuses,

  getAppVersion,
  showMainWindow,
  quitApp,

  showOpenDialog,
  openExternal,
  registerTargets,
  fetchSingleJobStatus,
  executeScript,

  startPolling,
  stopPolling,

  getRdpTargets,
  startRdpSession,

  tempomaticUploadDocument,

  login,
  loadAuthSession,
  logout,
};

// src/shared/api/commands.ts

import type { OAuthToken } from "@shared/types/authTypes";
import type { RdpTarget } from "@shared/types/rdpTypes";
import type { OperationStatusUpdatePayload } from "@shared/types/statusType";

// =====================================================
// Operation Job Status
// =====================================================

export interface JobStatusResponse {
  kanriNo: string;

  status?: string;

  startTime?: string;
  endTime?: string;

  expectedStartTime?: string;
  expectedEndTime?: string;

  comment?: string;

  substatus?: string[];

  info?: string;

  updatedAt: string;
}

export interface FetchJobStatusResult {
  success: boolean;

  data?: JobStatusResponse;

  error?: string;
}

// =====================================================
// System / Status
// =====================================================

export async function initializeStatus(): Promise<Record<string, unknown>> {
  return window.electronAPI.invoke<Record<string, unknown>>("initializeStatus");
}

export async function updateJobStatus(
  kanriNo: string,
  status: string,
): Promise<null> {
  return window.electronAPI.invoke<null>("updateJobStatus", {
    kanriNo,
    status,
  });
}

export async function deleteAllJobStatuses(): Promise<null> {
  return window.electronAPI.invoke<null>("deleteAllJobStatuses");
}

export async function getAppVersion(): Promise<string> {
  return window.electronAPI.invoke<string>("getAppVersion");
}

export async function showMainWindow(): Promise<null> {
  return window.electronAPI.invoke<null>("showMainWindow");
}

export async function quitApp(): Promise<null> {
  return window.electronAPI.invoke<null>("quitApp");
}

// =====================================================
// Operation
// =====================================================

export async function registerTargets(
  items: OperationStatusUpdatePayload[],
): Promise<null> {
  return window.electronAPI.invoke<null>("registerTargets", {
    items,
  });
}

/**
 * JC Job Status取得
 */
export async function fetchSingleJobStatus(
  kanriNo: string,
): Promise<FetchJobStatusResult> {
  return window.electronAPI.invoke<FetchJobStatusResult>(
    "fetchSingleJobStatus",
    {
      kanriNo,
    },
  );
}

export async function executeScript(scriptId: string): Promise<string> {
  return window.electronAPI.invoke<string>("executeScript", {
    scriptId,
  });
}

export async function getJobStatus(jobId: string): Promise<string> {
  return window.electronAPI.invoke<string>("getJobStatus", {
    jobId,
  });
}

export async function startPolling(): Promise<null> {
  return window.electronAPI.invoke<null>("startPolling");
}

export async function stopPolling(): Promise<null> {
  return window.electronAPI.invoke<null>("stopPolling");
}

// =====================================================
// Remote Desktop
// =====================================================

export async function getRdpTargets(): Promise<RdpTarget[]> {
  return window.electronAPI.invoke<RdpTarget[]>("getRdpTargets");
}

export async function startRdpSession(id: string): Promise<null> {
  return window.electronAPI.invoke<null>("startRdpSession", {
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
): Promise<string> {
  return window.electronAPI.invoke<string>("tempomaticUploadDocument", {
    filePaths,
    expireDate,
  });
}

// =====================================================
// Auth
// =====================================================

export async function hasGoogleCredentials(): Promise<boolean> {
  return window.electronAPI.invoke<boolean>("hasGoogleCredentials");
}

export async function getGoogleClientId(): Promise<string> {
  return window.electronAPI.invoke<string>("getGoogleClientId");
}

export async function startOAuthListener(port = 8888): Promise<{
  code: string;
  state: string;
}> {
  return window.electronAPI.invoke<{
    code: string;
    state: string;
  }>("startOAuthListener", {
    port,
  });
}

export async function saveAuthSession(token: OAuthToken): Promise<null> {
  return window.electronAPI.invoke<null>("saveAuthSession", token);
}

export async function checkAuthSession(): Promise<boolean> {
  return window.electronAPI.invoke<boolean>("checkAuthSession");
}

export async function refreshGoogleOauthCredentials(): Promise<string> {
  return window.electronAPI.invoke<string>("refreshGoogleOauthCredentials");
}

export async function clearAuthSession(): Promise<null> {
  return window.electronAPI.invoke<null>("clearAuthSession");
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

  registerTargets,

  fetchSingleJobStatus,

  executeScript,

  getJobStatus,

  startPolling,

  stopPolling,

  getRdpTargets,

  startRdpSession,

  tempomaticUploadDocument,

  hasGoogleCredentials,

  getGoogleClientId,

  startOAuthListener,

  saveAuthSession,

  checkAuthSession,

  refreshGoogleOauthCredentials,

  clearAuthSession,
};

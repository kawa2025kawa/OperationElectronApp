// src/shared/bindings.ts
// Electron IPC Bridge Functions

/* =============================================================
 * Types
 * ============================================================= */

export interface RdpTarget {
  id: string;
  name: string;
  server?: string;
  username?: string;
}

export interface OperationStatusUpdatePayload {
  kanriNo: string;
  workName?: string;
  jobId?: string | null;
  status?: string | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
}

export interface OperationStatusEvent {
  status: OperationStatusUpdatePayload;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  idToken?: string | null;
}

export type JobStatus =
  | "scheduled"
  | "waiting"
  | "ready"
  | "running"
  | "scriptRunning"
  | "success"
  | "error";

export interface OperationItem_Deserialize {
  kanriNo: string;
  workName: string;
  jobId?: string | null;
  scheduledTime?: string | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  requiresFile?: boolean | null;
  link?: Record<string, string> | null;
  url?: Record<string, string> | null;
  cycle1?: string | null;
  cycle2?: string | null;
  type?: string | null;
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

export type OperationItem_Serialize = OperationItem_Deserialize;

/* =============================================================
 * System / Status
 * ============================================================= */

export async function initializeStatus(): Promise<Record<string, unknown>> {
  return await window.electronAPI.invoke<Record<string, unknown>>("initialize_status");
}

export async function updateJobStatus(jobId: string, status: string): Promise<null> {
  return await window.electronAPI.invoke<null>("updateJobStatus", { jobId, status });
}

export async function deleteAllJobStatuses(): Promise<null> {
  return await window.electronAPI.invoke<null>("delete_all_job_statuses");
}

export async function getAppVersion(): Promise<string> {
  return await window.electronAPI.invoke<string>("getAppVersion");
}

export async function showMainWindow(): Promise<null> {
  return await window.electronAPI.invoke<null>("showMainWindow");
}

export async function quitApp(): Promise<null> {
  return await window.electronAPI.invoke<null>("quitApp");
}

/* =============================================================
 * Operation & Polling
 * ============================================================= */

export async function registerTargets(items: OperationStatusUpdatePayload[]): Promise<null> {
  return await window.electronAPI.invoke<null>("registerTargets", { items });
}

export async function fetchSingleJobStatus(kanriNo: string): Promise<null> {
  return await window.electronAPI.invoke<null>("fetch_single_job_status", { kanriNo });
}

export async function executeScript(scriptId: string): Promise<string> {
  return await window.electronAPI.invoke<string>("execute_script", { scriptId });
}

export async function getJobStatus(jobId: string): Promise<string> {
  return await window.electronAPI.invoke<string>("get_job_status", { jobId });
}

export async function startPolling(): Promise<null> {
  return await window.electronAPI.invoke<null>("startPolling");
}

export async function stopPolling(): Promise<null> {
  return await window.electronAPI.invoke<null>("stopPolling");
}

/* =============================================================
 * Remote Desktop
 * ============================================================= */

export async function getRdpTargets(): Promise<RdpTarget[]> {
  return await window.electronAPI.invoke<RdpTarget[]>("get_rdp_targets");
}

export async function startRdpSession(id: string): Promise<null> {
  return await window.electronAPI.invoke<null>("start_rdp_session", { payload: { id } });
}

/* =============================================================
 * Tempomatic
 * ============================================================= */

export async function tempomaticUploadDocument(
  filePaths: string[],
  expireDate: string,
): Promise<string> {
  return await window.electronAPI.invoke<string>("tempomaticUploadDocument", {
    filePaths,
    expireDate,
  });
}

/* =============================================================
 * Auth (Google OAuth)
 * ============================================================= */

export async function hasGoogleCredentials(): Promise<boolean> {
  return await window.electronAPI.invoke<boolean>("has_google_credentials");
}

export async function getGoogleClientId(): Promise<string> {
  return await window.electronAPI.invoke<string>("getGoogleClientId");
}

export async function startOAuthListener(
  port = 8888,
): Promise<{ code: string; state: string }> {
  return await window.electronAPI.invoke<{ code: string; state: string }>(
    "start_oauth_listener",
    { port },
  );
}

export async function saveAuthSession(token: OAuthToken): Promise<null> {
  return await window.electronAPI.invoke<null>("saveAuthSession", token);
}

export async function checkAuthSession(): Promise<boolean> {
  return await window.electronAPI.invoke<boolean>("checkAuthSession");
}

export async function refreshGoogleOauthCredentials(): Promise<string> {
  return await window.electronAPI.invoke<string>("refreshGoogleOauthCredentials");
}

export async function clearAuthSession(): Promise<null> {
  return await window.electronAPI.invoke<null>("clearAuthSession");
}

/* =============================================================
 * Events & Commands Export
 * ============================================================= */

export const events = {
  operationStatusUpdatedEvent: {
    listen: (
      callback: (event: { payload: OperationStatusEvent }) => void,
    ): Promise<() => void> => {
      const remove = window.electronAPI.on(
        "operationStatusUpdated",
        (...args: unknown[]) => {
          const payload = args[0] as OperationStatusEvent;
          callback({ payload });
        },
      );
      return Promise.resolve(remove);
    },
  },
};

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

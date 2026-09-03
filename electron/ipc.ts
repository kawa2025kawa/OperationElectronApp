// src/shared/types/electron/ipc.ts
import type { AuthSession } from "@shared/types/auth";
import type {
  JobResult,
  JobStatus,
  OperationItem,
} from "@shared/types/operation";
import type { RdpTarget } from "@shared/types/rdp";
import type { UpdateInfo } from "@shared/types/system";

export interface CreateGmailDraftParams {
  accessToken: string;
  raw: string;
}

export interface IpcChannelMap {
  // Operation / Polling
  startPolling: { args: []; return: void };
  stopPolling: { args: []; return: void };
  setActiveFlags: { args: [flags: Record<string, boolean>]; return: void };
  updateJobStatus: {
    args: [payload: { kanriNo: string; status: JobStatus; comment?: string }];
    return: void;
  };
  deleteAllJobStatuses: { args: []; return: void };
  fetchSingleJobStatus: {
    args: [payload: { kanriNo: string }];
    return: OperationItem;
  };
  registerTargets: {
    args: [payload: { items: OperationItem[] }];
    return: void;
  };
  initializeStatus: { args: []; return: Record<string, OperationItem> };

  // Jobs / Scripts
  executeScript: {
    args: [payload: { scriptId: string; filePath?: string | string[] }];
    return: JobResult;
  };

  // RDP
  getRdpTargets: { args: []; return: RdpTarget[] };
  startRdpSession: {
    args: [payload: { payload: { id: string } }];
    return: void;
  };

  // Authentication
  "googleAuth:loadSession": { args: []; return: AuthSession | null };
  "googleAuth:login": { args: []; return: AuthSession };
  "googleAuth:logout": { args: []; return: void };

  // System / File / External
  "tempomatic:uploadDocument": {
    args: [payload: { filePaths: string[]; expireDate: string }];
    return: boolean;
  };
  openExternal: { args: [payload: { urlOrPath: string }]; return: void };
  readUpdateInfo: { args: []; return: UpdateInfo | null };
  showMainWindow: { args: []; return: void };
  showOpenDialog: { args: [options: unknown]; return: unknown };

  // Gmail
  "gmail:getSignature": { args: [accessToken?: string]; return: string };
  "gmail:createDraft": { args: [params: CreateGmailDraftParams]; return: void };
}

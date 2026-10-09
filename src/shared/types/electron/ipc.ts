import type { AuthProfile } from "@shared/types/auth/authTypes";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { UpdateInfo } from "@shared/types/system";

export interface IpcChannelMap {
  "googleAuth:login": {
    args: [];
    return: AuthProfile;
  };

  "googleAuth:loadSession": {
    args: [forceRefresh?: boolean];
    return: AuthProfile | null;
  };

  "googleAuth:logout": {
    args: [];
    return: void;
  };

  "gmail:getSignature": {
    args: [];
    return: string;
  };

  "gmail:createDraft": {
    args: [params: { raw: string }];
    return: unknown;
  };

  openExternal: {
    args: [{ urlOrPath: string }];
    return: null;
  };

  "operation:registerTargets": {
    args: [{ masterData: MasterData }];
    return: void;
  };

  "operation:resetStatusesFromSpreadsheet": {
    args: [];
    return: Record<string, OperationStatusState>;
  };

  "operation:setActiveFlags": {
    args: [flags: Partial<ActiveFlags>];
    return: void;
  };

  "operation:deleteAllStatuses": {
    args: [];
    return: void;
  };

  "operation:initializeStatus": {
    args: [];
    return: Record<string, OperationStatusState>;
  };

  "operation:updateJobStatus": {
    args: [
      {
        kanriNo: string;
        status: JobStatus;
        comment?: string;
      },
    ];
    return: void;
  };

  "operation:startPolling": {
    args: [];
    return: void;
  };

  "operation:stopPolling": {
    args: [];
    return: void;
  };

  "operation:executeScript": {
    args: [
      {
        kanriNo: string;
        scriptKey: string;
        filePath?: string | string[];
      },
    ];
    return: JobResult;
  };

  "operation:fetchSingleJobStatus": {
    args: [{ kanriNo: string }];
    return: OperationStatusState | null;
  };

  "spreadsheet:master": {
    args: [];
    return: MasterData;
  };

  "rdp:getMasters": {
    args: [];
    return: MasterData["rdps"];
  };

  "rdp:startSession": {
    args: [{ payload: { name: string } }];
    return: null;
  };

  "gift-md:process": {
    args: [filePath?: string | string[]];
    return: string;
  };

  readUpdateInfo: {
    args: [];
    return: UpdateInfo | null;
  };

  "tempomatic:uploadDocument": {
    args: [{ filePaths: string[]; expireDate: string }];
    return: string;
  };

  showMainWindow: {
    args: [];
    return: null;
  };

  showOpenDialog: {
    args: [options: Record<string, unknown>];
    return: string[] | null;
  };

  getAppVersion: {
    args: [];
    return: string;
  };

  quitApp: {
    args: [];
    return: null;
  };
}

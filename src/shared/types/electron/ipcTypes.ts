// src/shared/types/electron/ipc.ts

import type { AuthProfile } from "@shared/types/auth/authTypes";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import type { UpdateInfo } from "@shared/types/system";
import type {
  StatusSummary,
  SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";

export interface IpcChannelMap {
  /* ================= Auth ================= */
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

  /* ================= System ================= */
  getAppVersion: {
    args: [];
    return: string;
  };
  showMainWindow: {
    args: [];
    return: null;
  };
  quitApp: {
    args: [];
    return: null;
  };
  openManual: {
    args: [{ target: string }];
    return: null;
  };
  openExternal: {
    args: [{ urlOrPath: string }];
    return: null;
  };
  showOpenDialog: {
    args: [options?: Record<string, unknown>];
    return: string[] | null;
  };
  readUpdateInfo: {
    args: [];
    return: UpdateInfo | null;
  };
  "theme-changed": {
    args: [theme: "light" | "dark" | "system"];
    return: void;
  };

  /* ================= RDP ================= */
  "rdp:getMasters": {
    args: [];
    return: RdpMaster[];
  };
  "rdp:startSession": {
    args: [{ name: string }];
    return: null;
  };

  /* ================= Gmail ================= */
  "gmail:getSignature": {
    args: [];
    return: string;
  };
  "gmail:generateDraftTemplate": {
    args: [
      params: {
        templateKey: "E8" | "E9" | "E10";
        familyName?: string;
        links?: Record<string, string> | null;
      },
    ];
    return: {
      to: string;
      cc: string;
      subject: string;
      body: string;
    };
  };
  "gmail:createDraft": {
    args: [
      params: {
        to?: string;
        cc?: string;
        subject?: string;
        body?: string;
        raw?: string;
      },
    ];
    return: unknown;
  };

  /* ================= Spreadsheet ================= */
  "spreadsheet:master": {
    args: [];
    return: SpreadsheetMasterData;
  };
  "spreadsheet:getFilteredData": {
    args: [
      params: {
        sheetName: string;
        searchTerm?: string;
        searchKeys?: string[];
      },
    ];
    return: Record<string, unknown>[];
  };

  /* ================= Tempomatic ================= */
  "tempomatic:uploadDocument": {
    args: [{ filePaths: string[]; expireDate?: string }];
    return: string;
  };

  /* ================= Other ================= */
  "gift-md:process": {
    args: [filePath: string];
    return: string;
  };

  /* ================= Operation ================= */
  "operation:getStatusSummary": {
    args: [];
    return: StatusSummary;
  };
  "operation:getSummaryDetails": {
    args: [{ filterKey: string }];
    return: SummaryDetailRow[];
  };
  "operation:getTableData": {
    args: [{ mode: "operation" | "irregular" | "today" }];
    return: OperationViewItem[];
  };
  "operation:getScriptExecutionRequirement": {
    args: [{ scriptKey: string }];
    return: { requiresFileSelection: boolean };
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
  "operation:registerTargets": {
    args: [];
    return: void;
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
        scriptKey?: string;
        filePath?: string | string[];
        ignoreDependencies?: boolean;
      },
    ];
    return: JobResult;
  };
  "operation:fetchSingleJobStatus": {
    args: [{ kanriNo: string }];
    return: OperationStatusState | null;
  };
  "operation:status-updated": {
    args: [status: OperationStatusState];
    return: void;
  };
  "polling-cycle-complete": {
    args: [];
    return: void;
  };
}

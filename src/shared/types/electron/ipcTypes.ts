// src/shared/types/electron/ipcTypes.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AuthProfile } from "@shared/types/auth/authTypes";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  OperationStatusNotification,
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
import type { EmailTemplateKey } from "@renderer/features/other/types/gmailDraftTypes";

export interface IpcEventMap {
  [IPC_CHANNELS.SYSTEM.THEME_CHANGED]: [theme: "light" | "dark" | "system"];
  [IPC_CHANNELS.OPERATION.STATUS_UPDATED]: [
    notification: OperationStatusNotification,
  ];
  [IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE]: [];
}

export interface IpcChannelMap {
  // Auth
  [IPC_CHANNELS.AUTH.LOGIN]: {
    args: [];
    return: AuthProfile;
  };
  [IPC_CHANNELS.AUTH.LOAD_SESSION]: {
    args: [forceRefresh?: boolean];
    return: AuthProfile | null;
  };
  [IPC_CHANNELS.AUTH.LOGOUT]: {
    args: [];
    return: void;
  };

  // System
  [IPC_CHANNELS.SYSTEM.GET_APP_VERSION]: {
    args: [];
    return: string;
  };
  [IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW]: {
    args: [];
    return: null;
  };
  [IPC_CHANNELS.SYSTEM.QUIT_APP]: {
    args: [];
    return: null;
  };
  [IPC_CHANNELS.SYSTEM.OPEN_MANUAL]: {
    args: [{ target: string }];
    return: null;
  };
  [IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL]: {
    args: [{ urlOrPath: string }];
    return: null;
  };
  [IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG]: {
    args: [options?: Record<string, unknown>];
    return: string[] | null;
  };
  [IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO]: {
    args: [];
    return: UpdateInfo | null;
  };

  // RDP
  [IPC_CHANNELS.RDP.GET_MASTERS]: {
    args: [];
    return: RdpMaster[];
  };
  [IPC_CHANNELS.RDP.START_SESSION]: {
    args: [{ name: string }];
    return: null;
  };

  // Gmail
  [IPC_CHANNELS.GMAIL.GET_SIGNATURE]: {
    args: [];
    return: string;
  };
  [IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE]: {
    args: [
      params: {
        templateKey: EmailTemplateKey;
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
  [IPC_CHANNELS.GMAIL.CREATE_DRAFT]: {
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

  // Spreadsheet
  [IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA]: {
    args: [];
    return: SpreadsheetMasterData;
  };
  [IPC_CHANNELS.SPREADSHEET.GET_FILTERED_DATA]: {
    args: [
      params: {
        sheetName: string;
        searchTerm?: string;
        searchKeys?: string[];
      },
    ];
    return: Record<string, unknown>[];
  };

  // Tempomatic
  [IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT]: {
    args: [{ filePaths: string[]; expireDate?: string }];
    return: string;
  };

  // Other
  [IPC_CHANNELS.OTHER.PROCESS_GIFT_MD]: {
    args: [filePath: string];
    return: string;
  };

  // Operation
  [IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY]: {
    args: [];
    return: StatusSummary;
  };
  [IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS]: {
    args: [{ filterKey: string }];
    return: SummaryDetailRow[];
  };
  [IPC_CHANNELS.OPERATION.GET_TABLE_DATA]: {
    args: [{ mode: "operation" | "irregular" | "today" }];
    return: OperationViewItem[];
  };
  [IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT]: {
    args: [{ scriptKey: string }];
    return: { requiresFileSelection: boolean };
  };
  [IPC_CHANNELS.OPERATION.RESET_STATUSES]: {
    args: [];
    return: Record<string, OperationStatusState>;
  };
  [IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS]: {
    args: [input: Partial<ActiveFlags> | { flags: Partial<ActiveFlags> }];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES]: {
    args: [];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.INITIALIZE_STATUS]: {
    args: [];
    return: Record<string, OperationStatusState>;
  };
  [IPC_CHANNELS.OPERATION.REGISTER_TARGETS]: {
    args: [];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS]: {
    args: [
      {
        kanriNo: string;
        status: JobStatus;
        comment?: string;
      },
    ];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.START_POLLING]: {
    args: [];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.STOP_POLLING]: {
    args: [];
    return: void;
  };
  [IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT]: {
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
  [IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS]: {
    args: [{ kanriNo: string }];
    return: OperationStatusState | null;
  };
}

// src/shared/types/constants/ipcChannelsTypes.ts

import type { IpcChannelMap } from "../electron/ipcTypes";

export const IPC_CHANNELS = {
  AUTH: {
    LOGIN: "googleAuth:login",
    LOAD_SESSION: "googleAuth:loadSession",
    LOGOUT: "googleAuth:logout",
  },
  SYSTEM: {
    GET_APP_VERSION: "getAppVersion",
    SHOW_MAIN_WINDOW: "showMainWindow",
    QUIT_APP: "quitApp",
    OPEN_MANUAL: "openManual",
    OPEN_EXTERNAL: "openExternal",
    SHOW_OPEN_DIALOG: "showOpenDialog",
    READ_UPDATE_INFO: "readUpdateInfo",
    THEME_CHANGED: "theme-changed",
  },
  RDP: {
    GET_MASTERS: "rdp:getMasters",
    START_SESSION: "rdp:startSession",
  },
  GMAIL: {
    GET_SIGNATURE: "gmail:getSignature",
    GENERATE_DRAFT_TEMPLATE: "gmail:generateDraftTemplate",
    CREATE_DRAFT: "gmail:createDraft",
  },
  SPREADSHEET: {
    GET_MASTER_DATA: "spreadsheet:master",
    GET_FILTERED_DATA: "spreadsheet:getFilteredData",
  },
  TEMPOMATIC: {
    UPLOAD_DOCUMENT: "tempomatic:uploadDocument",
  },
  OTHER: {
    PROCESS_GIFT_MD: "gift-md:process",
  },
  OPERATION: {
    GET_STATUS_SUMMARY: "operation:getStatusSummary",
    GET_SUMMARY_DETAILS: "operation:getSummaryDetails",
    GET_TABLE_DATA: "operation:getTableData",
    GET_SCRIPT_EXECUTION_REQUIREMENT: "operation:getScriptExecutionRequirement",
    RESET_STATUSES: "operation:resetStatusesFromSpreadsheet",
    SET_ACTIVE_FLAGS: "operation:setActiveFlags",
    DELETE_ALL_STATUSES: "operation:deleteAllStatuses",
    INITIALIZE_STATUS: "operation:initializeStatus",
    REGISTER_TARGETS: "operation:registerTargets",
    UPDATE_JOB_STATUS: "operation:updateJobStatus",
    START_POLLING: "operation:startPolling",
    STOP_POLLING: "operation:stopPolling",
    EXECUTE_SCRIPT: "operation:executeScript",
    FETCH_SINGLE_STATUS: "operation:fetchSingleJobStatus",
    STATUS_UPDATED: "operation:status-updated",
    POLLING_CYCLE_COMPLETE: "polling-cycle-complete",
  },
} as const;

export type IpcChannel = keyof IpcChannelMap;

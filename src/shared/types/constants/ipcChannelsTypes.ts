// src/shared/types/constants/ipcChannelsTypes.ts

import type { IpcChannelMap } from "../electron/ipc";

export const IPC_CHANNELS = {
  AUTH: {
    LOGIN: "googleAuth:login",
    LOAD_SESSION: "googleAuth:loadSession",
    LOGOUT: "googleAuth:logout",
  },
  GMAIL: {
    GET_SIGNATURE: "gmail:getSignature",
    CREATE_DRAFT: "gmail:createDraft",
  },
  OPERATION: {
    REGISTER_TARGETS: "operation:registerTargets",
    RESET_STATUSES: "operation:resetStatusesFromSpreadsheet",
    SET_ACTIVE_FLAGS: "operation:setActiveFlags",
    DELETE_ALL_STATUSES: "operation:deleteAllStatuses",
    INITIALIZE_STATUS: "operation:initializeStatus",
    UPDATE_JOB_STATUS: "operation:updateJobStatus",
    START_POLLING: "operation:startPolling",
    STOP_POLLING: "operation:stopPolling",
    EXECUTE_SCRIPT: "operation:executeScript",
    FETCH_SINGLE_STATUS: "operation:fetchSingleJobStatus",
    STATUS_UPDATED: "operation:status-updated",
    POLLING_CYCLE_COMPLETE: "polling-cycle-complete",
  },
  RDP: {
    GET_MASTERS: "rdp:getMasters",
    START_SESSION: "rdp:startSession",
  },
  SPREADSHEET: {
    MASTER: "spreadsheet:master",
  },
  GIFT_MD: {
    PROCESS: "gift-md:process",
  },
  TEMPOMATIC: {
    UPLOAD_DOCUMENT: "tempomatic:uploadDocument",
  },
  SYSTEM: {
    OPEN_EXTERNAL: "openExternal",
    READ_UPDATE_INFO: "readUpdateInfo",
    SHOW_MAIN_WINDOW: "showMainWindow",
    SHOW_OPEN_DIALOG: "showOpenDialog",
    GET_APP_VERSION: "getAppVersion",
    QUIT_APP: "quitApp",
    THEME_CHANGED: "theme-changed",
  },
} as const;

export type IpcChannel = keyof IpcChannelMap;

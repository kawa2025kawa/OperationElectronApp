// src/shared/types/constants/ipcChannelsTypes.ts

export const IPC_CHANNELS = {
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
  },

  RDP: {
    GET_MASTERS: "rdp:getMasters",
    START_SESSION: "rdp:startSession",
  },

  SPREADSHEET: {
    MASTER: "spreadsheet:master",
  },
} as const;

export type IpcChannel =
  | (typeof IPC_CHANNELS.OPERATION)[keyof typeof IPC_CHANNELS.OPERATION]
  | (typeof IPC_CHANNELS.RDP)[keyof typeof IPC_CHANNELS.RDP]
  | (typeof IPC_CHANNELS.SPREADSHEET)[keyof typeof IPC_CHANNELS.SPREADSHEET];

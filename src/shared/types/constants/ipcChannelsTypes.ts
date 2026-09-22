// src/shared/types/constants/ipcChannelsTypes.ts

export const IPC_CHANNELS = {
  OPERATION: {
    REGISTER_TARGETS: "operation:registerTargets",
    SYNC_MASTER: "operation:syncMaster",
    LOAD_MASTER_CACHE: "operation:loadMasterCache",
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
} as const;

// 🎯 オプション: チャンネル名の型抽出（IPC関連の型定義で使えるようにする）
export type IpcChannel =
  (typeof IPC_CHANNELS.OPERATION)[keyof typeof IPC_CHANNELS.OPERATION];

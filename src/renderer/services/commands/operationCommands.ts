// src/renderer/services/commands/operationCommands.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

import {
  JOB_STATUS_VALUES,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import type { OperationMasterData } from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Types
 * ========================= */

export type ScriptFilePath = string | string[];

type UnknownRecord = Record<string, unknown>;

/* =========================
 * Constants
 * ========================= */

const STATUS_EVENT_CHANNEL = "operation:status-updated";

const POLLING_CYCLE_COMPLETE_CHANNEL = "polling-cycle-complete";

/* =========================
 * Generic Validation
 * ========================= */

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

/* =========================
 * Value Normalization
 * ========================= */

function toKanriNo(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function toJobStatus(value: unknown): JobStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return JOB_STATUS_VALUES.includes(value as (typeof JOB_STATUS_VALUES)[number])
    ? (value as JobStatus)
    : undefined;
}

function toNullableString(value: unknown): string | null {
  return value == null ? null : String(value);
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  const result = String(value);

  return result || undefined;
}

/* =========================
 * Status Normalization
 * ========================= */

/**
 * IPCから受信したStatus payloadを
 * OperationStatusStateへ正規化する。
 *
 * IPC payloadの形式はこの境界で吸収する。
 */
function normalizeStatusPayload(payload: unknown): OperationStatusState | null {
  if (!isRecord(payload)) {
    return null;
  }

  /*
   * 通常: payload = OperationStatusState相当
   * 一部IPC: payload = { status: OperationStatusState }
   */
  const source = isRecord(payload.status) ? payload.status : payload;

  const kanriNo = toKanriNo(source.kanriNo ?? payload.kanriNo);

  if (!kanriNo) {
    return null;
  }

  return {
    kanriNo,
    status: toJobStatus(source.status),
    comment: toNullableString(source.comment),
    startTime: toOptionalString(source.startTime),
    endTime: toOptionalString(source.endTime),
    expectedStartTime: toOptionalString(source.expectedStartTime),
    expectedEndTime: toOptionalString(source.expectedEndTime),
    substatus: toOptionalString(source.substatus),
    info: toOptionalString(source.info),
  };
}

/**
 * Status MapをIPC payloadから復元する。
 *
 * 不正なEntryは除外する。
 */
function normalizeStatusMap(
  payload: unknown,
): Record<string, OperationStatusState> {
  if (!isRecord(payload)) {
    return {};
  }

  const result: Record<string, OperationStatusState> = {};

  for (const value of Object.values(payload)) {
    const status = normalizeStatusPayload(value);

    if (!status) {
      continue;
    }

    result[status.kanriNo] = status;
  }

  return result;
}

/* =========================
 * Status Event
 * ========================= */

/**
 * StatusイベントをRenderer Storeへ渡す前に
 * microtask単位でまとめる。
 *
 * 目的:
 *   IPCイベントが短時間に大量発生した場合でも、
 *   Store更新を1回にまとめる。
 */
function createStatusEventHandler(
  callback: (updates: OperationStatusState[]) => void,
): (payload: unknown) => void {
  let updateQueue: OperationStatusState[] = [];

  let isQueueScheduled = false;

  const flushQueue = (): void => {
    isQueueScheduled = false;

    if (updateQueue.length === 0) {
      return;
    }

    const updates = updateQueue;

    updateQueue = [];

    callback(updates);
  };

  return (payload: unknown): void => {
    const update = normalizeStatusPayload(payload);

    if (!update) {
      return;
    }

    updateQueue.push(update);

    if (isQueueScheduled) {
      return;
    }

    isQueueScheduled = true;

    queueMicrotask(flushQueue);
  };
}

/* =========================
 * Commands
 * ========================= */

export const operationCommands = {
  /* =========================
   * Polling
   * ========================= */

  startPolling(): Promise<void> {
    return window.electronAPI.invoke(IPC_CHANNELS.OPERATION.START_POLLING);
  },

  stopPolling(): Promise<void> {
    return window.electronAPI.invoke(IPC_CHANNELS.OPERATION.STOP_POLLING);
  },

  /* =========================
   * Active Flags
   * ========================= */

  setActiveFlags(flags?: Partial<ActiveFlags>): Promise<void> {
    return window.electronAPI.invoke(
      IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS,
      flags ?? {},
    );
  },

  /* =========================
   * Status Mutation
   * ========================= */

  updateJobStatus(
    kanriNo: string,
    status: JobStatus,
    comment?: string,
  ): Promise<void> {
    return window.electronAPI.invoke(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
      kanriNo,
      status,
      comment,
    });
  },

  deleteAllJobStatuses(): Promise<void> {
    return window.electronAPI.invoke(
      IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES,
    );
  },

  resetOperationStatuses(): Promise<Record<string, OperationStatusState>> {
    return window.electronAPI
      .invoke(IPC_CHANNELS.OPERATION.RESET_STATUSES)
      .then(normalizeStatusMap);
  },

  /* =========================
   * Status Query
   * ========================= */

  fetchSingleJobStatus(kanriNo: string): Promise<OperationStatusState | null> {
    return window.electronAPI
      .invoke(IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS, { kanriNo })
      .then(normalizeStatusPayload);
  },

  initializeStatus(): Promise<Record<string, OperationStatusState>> {
    return window.electronAPI
      .invoke(IPC_CHANNELS.OPERATION.INITIALIZE_STATUS)
      .then(normalizeStatusMap);
  },

  /* =========================
   * Script
   * ========================= */

  executeScript(scriptId: string, filePath?: ScriptFilePath) {
    return window.electronAPI.invoke(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, {
      scriptId,
      filePath,
    });
  },

  /* =========================
   * Target Registration
   * ========================= */

  registerTargets(masterData: OperationMasterData): Promise<void> {
    return window.electronAPI.invoke(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, {
      masterData,
    });
  },

  /* =========================
   * Events
   * ========================= */

  onOperationStatusUpdated(
    callback: (updates: OperationStatusState[]) => void,
  ) {
    return window.electronAPI.on(
      STATUS_EVENT_CHANNEL,
      createStatusEventHandler(callback),
    );
  },

  onPollingCycleComplete(callback: (nextPollTime: number) => void) {
    return window.electronAPI.on(
      POLLING_CYCLE_COMPLETE_CHANNEL,
      (payload: unknown) => {
        const nextPollTime =
          typeof payload === "number" ? payload : Date.now() + 60_000;

        callback(nextPollTime);
      },
    );
  },
} as const;

// electron/features/operation/application/statusState.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
  type OperationMaster,
  type OperationStatusNotification,
  type OperationStatusState,
  type TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type {
  DependencyMasters,
  DependencyStatuses,
} from "@electron/features/operation/domain/dependencyUtils";
import {
  loadActiveFlags,
  persistActiveFlags,
} from "@electron/features/operation/infrastructure/operationStorage";
import { DependencyPropagator } from "./dependencyPropagator";

export type StatusTarget =
  | (OperationMaster & { targetType: "operation" })
  | (TodayIrregularMaster & { targetType: "today" });

export type ReadyStatusListener = (target: StatusTarget) => void;

export interface ApplyStatusOptions {
  propagate?: boolean;
  flags?: ActiveFlags;
}

export const statusState = {
  targets: new Map<string, StatusTarget>(),
  statuses: new Map<string, OperationStatusState>(),
  activeFlags: { ...DEFAULT_ACTIVE_FLAGS } as ActiveFlags,
  dependencyMasters: {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  } as DependencyMasters,
  propagator: new DependencyPropagator(),
};

const readyStatusListeners = new Set<ReadyStatusListener>();

function sendToAllWindows(channel: string, payload?: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      try {
        if (payload !== undefined) {
          window.webContents.send(channel, payload);
        } else {
          window.webContents.send(channel);
        }
      } catch (error) {
        console.error(`[StatusNotifier] 送信エラー (${channel}):`, error);
      }
    }
  }
}

export function notifyStatusUpdated(status: OperationStatusState): void {
  const notification: OperationStatusNotification = {
    type: "updated",
    update: status,
  };
  sendToAllWindows(IPC_CHANNELS.OPERATION.STATUS_UPDATED, notification);
}

export function notifyStatusCleared(kanriNo: string): void {
  const notification: OperationStatusNotification = {
    type: "cleared",
    kanriNo,
  };
  sendToAllWindows(IPC_CHANNELS.OPERATION.STATUS_UPDATED, notification);
}

export function notifyPollingCycleCompleted(): void {
  sendToAllWindows(IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE);
}

export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);
  return () => {
    readyStatusListeners.delete(listener);
  };
}

export function getDependencyMasters(): DependencyMasters {
  return statusState.dependencyMasters;
}

export function getDependencyStatuses(): DependencyStatuses {
  return { statuses: statusState.statuses };
}

export function getTargets(): Map<string, StatusTarget> {
  return new Map(statusState.targets);
}

export function getStatuses(): Map<string, OperationStatusState> {
  return new Map(statusState.statuses);
}

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statusState.statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return statusState.targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...statusState.targets.values()];
}

export async function initializeActiveFlags(): Promise<void> {
  statusState.activeFlags = await loadActiveFlags();
}

export function getActiveFlags(): ActiveFlags {
  return { ...statusState.activeFlags };
}

export function setActiveFlagsState(flags: Partial<ActiveFlags>): ActiveFlags {
  const nextFlags: ActiveFlags = {
    ...statusState.activeFlags,
    ...flags,
  };
  void persistActiveFlags(nextFlags);
  statusState.activeFlags = nextFlags;
  return nextFlags;
}

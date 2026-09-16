// electron/features/operation/statusManager.ts

import { BrowserWindow } from "electron";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationJobItem,
  type IrregularJobItem,
  type OperationStatusFields,
} from "@shared/types/operation";
import { executeJcJobImmediately } from "./runners/jcRunner";
import { executeScriptJobImmediately } from "./runners/scriptRunner";
import { evaluateAllTargetStatuses } from "./polling/pollingStatusEvaluator";

export type { PersistedStatus };

export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();

const keyOf = (val?: string | number): string => String(val ?? "").trim();

function broadcastStatusUpdate(item: OperationItem): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send("operationStatusUpdated", { status: item });
    }
  });
}

export function sanitizeStatus(
  item: Partial<OperationStatusFields>,
): PersistedStatus {
  return {
    status: item.status ?? JOB_STATUS.SCHEDULED,
    comment: item.comment ?? "",
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    expectedStartTime: item.expectedStartTime ?? null,
    expectedEndTime: item.expectedEndTime ?? null,
    substatus: item.substatus ?? null,
    info: item.info ?? null,
  };
}

export function getMergedEntity<T extends OperationItem>(target: T): T {
  const k = keyOf(target.kanriNo);
  const p = memoryStatuses.get(k);
  return { ...target, ...p, kanriNo: k };
}

export function registerTargets(
  items: (OperationJobItem | IrregularJobItem)[],
): void {
  apiTargets.clear();
  let changed = false;

  for (const item of items) {
    const k = keyOf(item.kanriNo);
    if (!k) continue;
    apiTargets.set(k, item);
    if (!memoryStatuses.has(k)) {
      memoryStatuses.set(k, sanitizeStatus(item));
      changed = true;
    }
  }

  for (const k of memoryStatuses.keys()) {
    if (!apiTargets.has(k)) {
      memoryStatuses.delete(k);
      changed = true;
    }
  }

  if (changed) schedulePersistStatuses(memoryStatuses);
}

export function updateStatus(update: StatusUpdate): boolean {
  const k = keyOf(update.kanriNo);
  const prev = memoryStatuses.get(k);
  if (!k || !prev) return false;

  const next = sanitizeStatus({ ...prev, ...update });
  if (JSON.stringify(prev) === JSON.stringify(next)) return false;

  const isNewReady =
    prev.status !== JOB_STATUS.READY && next.status === JOB_STATUS.READY;
  const isTerminated =
    next.status === JOB_STATUS.SUCCESS || next.status === JOB_STATUS.ERROR;

  memoryStatuses.set(k, next);

  const target = apiTargets.get(k);
  if (target) {
    const merged = getMergedEntity(target);
    broadcastStatusUpdate(merged);

    // 🎯 READY へ変更された瞬間、即座にJC / Scriptの即時起動チェックを発火
    if (isNewReady) {
      void executeJcJobImmediately(merged);
      void executeScriptJobImmediately(merged);
    }
  }

  schedulePersistStatuses(memoryStatuses);

  // 🎯【タイムラグ完全解消】ジョブが SUCCESS や ERROR に完了した瞬間、
  // 60秒ポーリングを待たずに即座に全ターゲットの再評価を回す！
  // (これにより 44 完了直後に 45 が 13:02 前なら即時 WAITING、13:02 越えなら即時 READY へ連鎖更新される)
  if (isTerminated) {
    setImmediate(() => {
      evaluateAllTargetStatuses(getAllTargets(), () => true);
    });
  }

  return true;
}
export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
  updateStatus({ kanriNo, status, comment, endTime: new Date().toISOString() });
}

export const getTargetByKanriNo = (kanriNo: string | number) =>
  apiTargets.get(keyOf(kanriNo));

export const getAllTargets = () =>
  Array.from(apiTargets.values(), getMergedEntity);

export const getStatus = (kanriNo: string | number) =>
  memoryStatuses.get(keyOf(kanriNo));

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();
  await deleteStatusFile();
}

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  memoryStatuses.clear();
  const data = await loadStatusesFromFile();

  for (const [k, status] of Object.entries(data)) {
    const s = sanitizeStatus(status);
    if (
      s.status === JOB_STATUS.RUNNING ||
      s.status === JOB_STATUS.SCRIPT_RUNNING
    ) {
      s.status = JOB_STATUS.ERROR;
      s.comment = "アプリ終了時の異常中断";
    }
    memoryStatuses.set(keyOf(k), s);
  }

  return Object.fromEntries(memoryStatuses);
}

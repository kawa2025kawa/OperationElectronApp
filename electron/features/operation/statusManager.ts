import { BrowserWindow } from "electron";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import { calculateJobStatus } from "./helpers/statusCalculator";
import { getActiveFlags } from "./activeFlagsManager";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  isRunningStatus,
  isTerminalStatus,
} from "@shared/utils/statusUtils";
import { resolveInitialStatus } from "./helpers/initialStatusResolver";
import { loadMasterCache } from "./services/operationMasterService";

export type { PersistedStatus };

export interface StatusUpdate extends OperationStatusState {
  kanriNo: string | number;
}

type StatusChangedHandler = (
  kanriNo: string | number,
) => void;

let statusChangedHandler: StatusChangedHandler | null = null;

const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();

export function setStatusChangedHandler(
  handler: StatusChangedHandler | null,
): void {
  statusChangedHandler = handler;
}

function isStatusEqual(
  previous: PersistedStatus,
  next: PersistedStatus,
): boolean {
  return (
    previous.status === next.status &&
    previous.comment === next.comment &&
    previous.startTime === next.startTime &&
    previous.endTime === next.endTime &&
    previous.expectedStartTime === next.expectedStartTime &&
    previous.expectedEndTime === next.expectedEndTime &&
    previous.substatus === next.substatus &&
    previous.info === next.info
  );
}

export function sanitizeStatus(
  source: Partial<OperationStatusState>,
): PersistedStatus {
  return {
    status:
      source.status ??
      JOB_STATUS.SCHEDULED,
    comment: source.comment ?? "",
    startTime: source.startTime ?? null,
    endTime: source.endTime ?? null,
    expectedStartTime:
      source.expectedStartTime ?? null,
    expectedEndTime:
      source.expectedEndTime ?? null,
    substatus: source.substatus ?? null,
    info: source.info ?? null,
  };
}

export function getMergedEntity<T extends OperationItem>(
  target: T,
): T {
  const kanriNo = String(target.kanriNo);
  const persistedStatus =
    memoryStatuses.get(kanriNo);

  return persistedStatus
    ? { ...target, ...persistedStatus }
    : target;
}

export function broadcastStatusUpdate(
  item: OperationItem,
): void {
  const payload = { status: item };

  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue;

    window.webContents.send(
      "operation:status-updated",
      payload,
    );
  }
}

export function registerTargets(
  items: OperationItem[],
): void {
  apiTargets.clear();

  const targetMap = createTargetMap(items);
  let changed = false;

  for (const item of items) {
    const kanriNo = String(item.kanriNo).trim();

    if (!kanriNo) continue;

    apiTargets.set(kanriNo, item);

    if (memoryStatuses.has(kanriNo)) {
      continue;
    }

    const initialStatus =
      resolveInitialStatus(
        item,
        targetMap,
      );

    memoryStatuses.set(
      kanriNo,
      sanitizeStatus({
        ...item,
        status: initialStatus,
      }),
    );

    changed = true;
  }

  for (const kanriNo of memoryStatuses.keys()) {
    if (!apiTargets.has(kanriNo)) {
      memoryStatuses.delete(kanriNo);
      changed = true;
    }
  }

  if (changed) {
    schedulePersistStatuses(
      memoryStatuses,
    );
  }
}

function createTargetMap(
  items: OperationItem[],
): Record<string, OperationItem> {
  const targetMap: Record<
    string,
    OperationItem
  > = {};

  for (const item of items) {
    const kanriNo = String(item.kanriNo).trim();

    if (kanriNo) {
      targetMap[kanriNo] = item;
    }
  }

  return targetMap;
}

export function updateStatus(
  update: StatusUpdate,
): boolean {
  const kanriNo = String(
    update.kanriNo,
  ).trim();

  if (!kanriNo) return false;

  const target =
    apiTargets.get(kanriNo);

  const previous =
    memoryStatuses.get(kanriNo) ??
    (target
      ? sanitizeStatus(target)
      : undefined);

  if (!previous) return false;

  const next = sanitizeStatus({
    ...previous,
    ...update,
  });

  if (isStatusEqual(previous, next)) {
    return false;
  }

  const becameReady =
    previous.status !== JOB_STATUS.READY &&
    next.status === JOB_STATUS.READY;

  const becameTerminal =
    !isTerminalStatus(
      previous.status,
    ) &&
    isTerminalStatus(next.status);

  memoryStatuses.set(
    kanriNo,
    next,
  );

  if (target) {
    broadcastStatusUpdate(
      getMergedEntity(target),
    );
  }

  schedulePersistStatuses(
    memoryStatuses,
  );

  if (
    becameReady ||
    becameTerminal
  ) {
    statusChangedHandler?.(kanriNo);
  }

  return true;
}

export function updateManualStatus(
  kanriNo: string,
  status: JobStatus,
  comment: string,
): void {
  updateStatus({
    kanriNo,
    status,
    comment,
    endTime:
      new Date().toISOString(),
  });
}

export function resetAllStatusesToScheduled(
  targets: OperationItem[],
): OperationItem[] {
  apiTargets.clear();
  memoryStatuses.clear();

  const targetMap =
    createTargetMap(targets);

  const activeFlags =
    getActiveFlags();

  for (const item of targets) {
    const kanriNo = String(
      item.kanriNo,
    ).trim();

    if (!kanriNo) continue;

    apiTargets.set(
      kanriNo,
      item,
    );

    const {
      status,
      comment,
    } = calculateJobStatus(
      item,
      targetMap,
      activeFlags,
    );

    memoryStatuses.set(
      kanriNo,
      sanitizeStatus({
        ...item,
        status,
        comment,
      }),
    );
  }

  schedulePersistStatuses(
    memoryStatuses,
  );

  const updatedTargets =
    getAllTargets();

  for (const target of updatedTargets) {
    broadcastStatusUpdate(
      target,
    );
  }

  return updatedTargets;
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): OperationItem | undefined {
  return apiTargets.get(
    String(kanriNo).trim(),
  );
}

export function getAllTargets(): OperationItem[] {
  return Array.from(
    apiTargets.values(),
    getMergedEntity,
  );
}

export function getStatus(
  kanriNo: string | number,
): PersistedStatus | undefined {
  return memoryStatuses.get(
    String(kanriNo).trim(),
  );
}

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();

  for (const [
    kanriNo,
    target,
  ] of apiTargets) {
    memoryStatuses.set(
      kanriNo,
      sanitizeStatus(target),
    );
  }

  await deleteStatusFile();
}

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  memoryStatuses.clear();

  initializeTargetsFromCache();

  const persistedStatuses =
    await loadStatusesFromFile();

  restorePersistedStatuses(
    persistedStatuses,
  );

  return Object.fromEntries(
    memoryStatuses,
  );
}

function initializeTargetsFromCache(): void {
  const cache =
    loadMasterCache();

  if (!cache) return;

  registerTargets([
    ...cache.operations,
    ...cache.todayIrregulars,
  ]);
}

function restorePersistedStatuses(
  data: Record<string, PersistedStatus>,
): void {
  for (const [
    kanriNo,
    persistedStatus,
  ] of Object.entries(data)) {
    if (!kanriNo) continue;

    if (!apiTargets.has(kanriNo)) {
      continue;
    }

    const status =
      sanitizeStatus(
        persistedStatus,
      );

    if (
      isRunningStatus(
        status.status,
      )
    ) {
      status.status =
        JOB_STATUS.ERROR;
      status.comment =
        "アプリ終了時の異常中断";
    }

    memoryStatuses.set(
      kanriNo,
      status,
    );
  }
}
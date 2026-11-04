// electron/features/operation/application/statusManager.ts

export type {
  ApplyStatusOptions,
  ReadyStatusListener,
  StatusTarget,
} from "./statusTypes";

export { statusState } from "./statusState";

export {
  getDependencyMasters,
  getDependencyStatuses,
  getTargets,
  getStatuses,
  getStatus,
  getTargetByKanriNo,
  getRegisteredTargets,
} from "./statusState";

export {
  notifyStatusUpdated,
  notifyStatusCleared,
  notifyReady,
  onReadyStatus,
} from "./statusNotifier";

export {
  recalculateTargetStatus,
  recalculateAllStatuses,
  updateStatus,
  updateManualStatus,
} from "./statusUpdater";

export {
  initializeActiveFlags,
  getActiveFlags,
  updateOperationActiveFlags,
} from "./statusFlagService";

export {
  resetAllStatusesAndTargets,
  registerTargets,
  initializeStatuses,
  deleteAllStatuses,
  saveStatusesImmediately,
  registerOperationTargets,
  resetOperationStatuses,
} from "./statusLifecycleService";

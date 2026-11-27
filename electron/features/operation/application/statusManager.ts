// electron/features/operation/application/statusManager.ts

export {
  getDependencyMasters,
  getDependencyStatuses,
  getTargets,
  getStatuses,
  getStatus,
  getTargetByKanriNo,
  getRegisteredTargets,
  onReadyStatus,
  initializeActiveFlags,
  getActiveFlags,
  type StatusTarget,
} from "./statusState";

export {
  recalculateTargetStatus,
  recalculateAllStatuses,
  updateOperationActiveFlags,
  updateStatus,
  updateManualStatus,
} from "./statusUpdater";

export {
  initializeStatuses,
  deleteAllStatuses,
  registerOperationTargets,
  ensureOperationInitialized,
  resetOperationStatuses,
} from "./statusLifecycleService";
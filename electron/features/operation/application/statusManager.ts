// electron/features/operation/application/statusManager.ts

export type { StatusTarget } from "./statusTypes";

export {
  getDependencyMasters,
  getDependencyStatuses,
  getTargets,
  getStatuses,
  getStatus,
  getTargetByKanriNo,
  getRegisteredTargets,
} from "./statusState";

export { onReadyStatus } from "./statusNotifier";

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
  initializeStatuses,
  deleteAllStatuses,
  registerOperationTargets,
  resetOperationStatuses,
} from "./statusLifecycleService";

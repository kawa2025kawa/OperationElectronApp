// electron/features/operation/polling/index.ts
export {
  startPolling,
  stopPolling,
  isPollingRunning,
  runCycle,
} from "./pollingLoop";

export {
  hasJobId,
  isTrackerTarget,
  getActiveTrackerTargets,
  syncTrackerStatuses,
} from "./trackerMonitor";

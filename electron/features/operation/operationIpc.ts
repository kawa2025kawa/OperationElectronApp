import { executeJob } from "@electron/features/operation/jobRunner";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/polling";
import {
  deleteAllStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  registerTargets,
  updateManualStatus,
} from "@electron/features/operation/statusManager";
import { fetchTrackerByJobId } from "@electron/features/operation/services/trackerServiceClient";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import { ipcMain } from "electron";

export function registerOperationIpc(): void {
  ipcMain.handle(
    "registerTargets",
    async (_event, args: { items?: OperationItem[] }) => {
      const items = args?.items ?? [];
      registerTargets(items);
    },
  );

  ipcMain.handle(
    "updateJobStatus",
    async (
      _event,
      args: {
        kanriNo: string;
        status: JobStatus;
        comment?: string;
      },
    ) => {
      const kanriNo = String(args?.kanriNo ?? "");
      const status = args?.status;
      if (!kanriNo || !status) {
        throw new Error("Invalid parameters");
      }
      updateManualStatus(kanriNo, status, args?.comment ?? "");
    },
  );

  ipcMain.handle("deleteAllJobStatuses", deleteAllStatuses);
  ipcMain.handle("initializeStatus", initializeStatuses);
  ipcMain.handle("startPolling", startPolling);
  ipcMain.handle("stopPolling", stopPolling);

  ipcMain.handle(
    "executeScript",
    async (
      _event,
      args: { scriptId: string; filePath?: string | string[] },
    ) => {
      if (!args?.scriptId) {
        throw new Error("scriptId is required");
      }
      return executeJob(args.scriptId, args.filePath);
    },
  );

  ipcMain.handle(
    "fetchSingleJobStatus",
    async (_event, args?: { kanriNo?: string }) => {
      const kanriNo = args?.kanriNo;
      if (!kanriNo) {
        throw new Error("kanriNo is required");
      }
      const target = getTargetByKanriNo(kanriNo);
      if (!target) {
        throw new Error(`Target not found (kanriNo=${kanriNo})`);
      }

      const jobId =
        "jobId" in target && typeof target.jobId === "string"
          ? target.jobId
          : undefined;
      if (!jobId || jobId === "-") {
        throw new Error(`Invalid jobId (kanriNo=${kanriNo})`);
      }

      const [tracker] = await fetchTrackerByJobId(target);
      if (!tracker) {
        throw new Error("Tracker data not found");
      }

      return {
        kanriNo,
        jobId,
        status: tracker.status,
        startTime: tracker.startTime,
        endTime: tracker.endTime,
        expectedStartTime: tracker.expectedStartTime,
        expectedEndTime: tracker.expectedEndTime,
        comment: tracker.comment,
        substatus: tracker.substatus,
        info: tracker.info,
        updatedAt: new Date().toISOString(),
      };
    },
  );
}

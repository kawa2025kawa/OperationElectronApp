// electron/features/operation/operationIpc.ts
import { ipcMain } from "electron";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import {
  registerTargets as registerOperationTargets,
  getTargetByKanriNo,
} from "@electron/features/operation/targetManager";
import {
  registerTargets as registerStatusTargets,
  updateManualStatus,
  deleteAllStatuses,
  initializeStatuses,
} from "@electron/features/operation/statusManager";
import { fetchTrackerByJobId } from "@electron/features/operation/tracker";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/polling";
import { executeJob } from "@electron/features/operation/jobRunner";

export function registerOperationIpc(): void {
  ipcMain.handle(
    "registerTargets",
    async (_event, args: { items?: OperationItem[] }) => {
      const items = args?.items ?? [];
      registerOperationTargets(items);
      registerStatusTargets(items);
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
      const comment = args?.comment ?? "";
      if (!kanriNo || !status) {
        throw new Error("Invalid parameters");
      }
      updateManualStatus(kanriNo, status, comment);
    },
  );

  ipcMain.handle("deleteAllJobStatuses", async () => {
    await deleteAllStatuses();
  });

  ipcMain.handle("initializeStatus", async () => {
    return initializeStatuses();
  });

  ipcMain.handle(
    "executeScript",
    async (_event, args: { scriptId: string }) => {
      if (!args?.scriptId) {
        throw new Error("scriptId is required");
      }
      return executeJob(args.scriptId);
    },
  );

  ipcMain.handle("startPolling", () => {
    startPolling();
  });

  ipcMain.handle("stopPolling", () => {
    stopPolling();
  });

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

      // 型ガードで jobId の存在を安全に検証
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

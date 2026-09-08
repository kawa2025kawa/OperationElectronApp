// electron/features/operation/operationIpc.ts
import { ipcMain, dialog } from "electron";
import fs from "node:fs";
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
  setActiveFlags,
  updateManualStatus,
} from "@electron/features/operation/statusManager";
import { fetchTrackerByJobId } from "@electron/features/operation/services/trackerServiceClient";
import type { OperationItem, OperationJobItem } from "@shared/types/operation";

const cleanKanriNo = (val?: string | number) => String(val ?? "").trim();

function getValidJobId(target: OperationJobItem, kanriNo: string): string {
  const jobId = typeof target.jobId === "string" ? target.jobId.trim() : "";
  if (!jobId || jobId === "-")
    throw new Error(`Invalid jobId (kanriNo=${kanriNo})`);
  return jobId;
}

export function registerOperationIpc(): void {
  // Target & Status Handlers
  ipcMain.handle("registerTargets", (_, args) =>
    registerTargets(args?.items ?? []),
  );
  ipcMain.handle("setActiveFlags", (_, flags) => setActiveFlags(flags ?? {}));
  ipcMain.handle("deleteAllJobStatuses", deleteAllStatuses);
  ipcMain.handle("initializeStatus", initializeStatuses);

  ipcMain.handle("updateJobStatus", (_, args) => {
    const kanriNo = cleanKanriNo(args?.kanriNo);
    if (!kanriNo || !args?.status) throw new Error("Invalid parameters");
    updateManualStatus(kanriNo, args.status, args.comment ?? "");
  });

  // Polling Handlers
  ipcMain.handle("startPolling", startPolling);
  ipcMain.handle("stopPolling", stopPolling);

  // Script Handler
  ipcMain.handle("executeScript", async (_, args) => {
    const scriptId = cleanKanriNo(args?.scriptId);
    if (!scriptId) throw new Error("scriptId is required");
    try {
      return await executeJob(scriptId, args?.filePath);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const zipMatch = errorMessage.match(/([A-Z]:\\[^\r\n]+\.zip)/i);
      if (zipMatch) {
        const response = dialog.showMessageBoxSync({
          type: "question",
          buttons: ["削除して再実行", "キャンセル"],
          defaultId: 0,
          cancelId: 1,
          title: "ZIPファイル存在エラー",
          message:
            "出力先のZipファイルが既に存在します。削除して再実行しますか？",
          detail: zipMatch[1],
        });
        if (response === 0) {
          if (fs.existsSync(zipMatch[1])) fs.unlinkSync(zipMatch[1]);
          return await executeJob(scriptId, args?.filePath);
        }
      }
      throw error;
    }
  });

  // Tracker Handler
  ipcMain.handle(
    "fetchSingleJobStatus",
    async (_, args): Promise<OperationItem> => {
      const kanriNo = cleanKanriNo(args?.kanriNo);
      if (!kanriNo) throw new Error("kanriNo is required");

      const target = getTargetByKanriNo(kanriNo);
      if (!target) throw new Error(`Target not found (kanriNo=${kanriNo})`);
      if (target.kind !== "operation")
        throw new Error(`Target is not an operation job (kanriNo=${kanriNo})`);

      const jobId = getValidJobId(target, kanriNo);
      const [tracker] = await fetchTrackerByJobId(target);
      if (!tracker) throw new Error("Tracker data not found");

      return {
        ...target,
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

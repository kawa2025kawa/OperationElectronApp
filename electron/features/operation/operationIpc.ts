// electron/features/operation/operationIpc.ts

import { ipcMain, dialog } from "electron";
import fs from "fs";
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

import type {
  JobResult,
  JobStatus,
  OperationItem,
  OperationJobItem,
} from "@shared/types/operation";

interface RegisterTargetsArgs {
  items?: OperationItem[];
}

interface UpdateJobStatusArgs {
  kanriNo?: string;
  status?: JobStatus;
  comment?: string;
}

interface ExecuteScriptArgs {
  scriptId?: string;
  filePath?: string | string[];
}

interface FetchSingleJobStatusArgs {
  kanriNo?: string;
}

/**
 * Operation関連のIPCハンドラを登録する。
 */
export function registerOperationIpc(): void {
  registerTargetHandlers();
  registerStatusHandlers();
  registerPollingHandlers();
  registerScriptHandlers();
  registerTrackerHandlers();
}

/**
 * Operation対象登録系IPC。
 */
function registerTargetHandlers(): void {
  ipcMain.handle("registerTargets", (_event, args: RegisterTargetsArgs) => {
    registerTargets(args?.items ?? []);
  });

  ipcMain.handle("setActiveFlags", (_event, flags: Record<string, boolean>) => {
    setActiveFlags(flags ?? {});
  });
}

/**
 * ステータス操作系IPC。
 */
function registerStatusHandlers(): void {
  ipcMain.handle("updateJobStatus", (_event, args: UpdateJobStatusArgs) => {
    const kanriNo = normalizeKanriNo(args?.kanriNo);
    const status = args?.status;

    if (!kanriNo || !status) {
      throw new Error("Invalid parameters");
    }

    updateManualStatus(kanriNo, status, args?.comment ?? "");
  });

  ipcMain.handle("deleteAllJobStatuses", deleteAllStatuses);

  ipcMain.handle("initializeStatus", initializeStatuses);
}

/**
 * Polling操作系IPC。
 */
function registerPollingHandlers(): void {
  ipcMain.handle("startPolling", startPolling);

  ipcMain.handle("stopPolling", stopPolling);
}

/**
 * スクリプト実行系IPC。
 */
function registerScriptHandlers(): void {
  ipcMain.handle(
    "executeScript",
    async (_event, args: ExecuteScriptArgs): Promise<JobResult> => {
      const scriptId = normalizeKanriNo(args?.scriptId);

      if (!scriptId) {
        throw new Error("scriptId is required");
      }

      try {
        return await executeJob(scriptId, args?.filePath);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("既にZIPファイルが存在します")) {
          const match = errorMessage.match(/([A-Z]:\\[^\r\n]+\.zip)/i);
          const zipPath = match ? match[1] : null;

          const response = dialog.showMessageBoxSync({
            type: "question",
            buttons: ["上書きして実行", "キャンセル"],
            defaultId: 0,
            cancelId: 1,
            title: "ファイルの重複確認",
            message: "同名のZIPファイルが既に存在します。",
            detail: zipPath
              ? `既存ファイルを削除して再実行しますか？\n${zipPath}`
              : "既存ファイルを削除して再実行しますか？",
          });

          if (response === 0) {
            if (zipPath && fs.existsSync(zipPath)) {
              fs.unlinkSync(zipPath);
            }
            return await executeJob(scriptId, args?.filePath);
          }
        }

        throw error;
      }
    },
  );
}

/**
 * Tracker取得系IPC。
 */
function registerTrackerHandlers(): void {
  ipcMain.handle(
    "fetchSingleJobStatus",
    async (_event, args?: FetchSingleJobStatusArgs): Promise<OperationItem> => {
      const kanriNo = normalizeKanriNo(args?.kanriNo);

      if (!kanriNo) {
        throw new Error("kanriNo is required");
      }

      const target = getTargetByKanriNo(kanriNo);

      if (!target) {
        throw new Error(`Target not found (kanriNo=${kanriNo})`);
      }

      // target.kind !== "operation" の場合は型ガードで弾く
      if (target.kind !== "operation") {
        throw new Error(`Target is not an operation job (kanriNo=${kanriNo})`);
      }

      const jobId = getValidJobId(target, kanriNo);
      const [tracker] = await fetchTrackerByJobId(target);

      if (!tracker) {
        throw new Error("Tracker data not found");
      }

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

// ============================================================
// Helpers
// ============================================================

function normalizeKanriNo(value: string | number | undefined): string {
  return String(value ?? "").trim();
}

function getValidJobId(target: OperationJobItem, kanriNo: string): string {
  const jobId = typeof target.jobId === "string" ? target.jobId.trim() : "";

  if (!jobId || jobId === "-") {
    throw new Error(`Invalid jobId (kanriNo=${kanriNo})`);
  }

  return jobId;
}

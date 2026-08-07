import { ipcMain } from "electron";

import type { OperationItem, JobStatus } from "@shared/types/operationType";

import { registerTargets } from "../services/operation/targetManager";

import { updateManualStatus } from "../services/statusManager";

export function setupOperationHandlers(): void {
  /**
   * 監視対象登録
   *
   * Tauri:
   *
   * register_targets()
   *
   * 相当
   */
  ipcMain.handle(
    "registerTargets",
    async (
      _event,
      args: {
        items?: OperationItem[];
      },
    ) => {
      const items = args?.items ?? [];

      console.log("[registerTargets]", {
        count: items.length,
        targets: items.map((item) => ({
          kanriNo: item.kanriNo,

          jobId: item.jobId,

          scheduledTime: item.scheduledTime,

          kanshiTime: item.kanshiTime,
        })),
      });

      registerTargets(items);

      return {
        success: true,
      };
    },
  );

  /**
   * 手動ステータス更新
   *
   * Tauri:
   *
   * update_job_status()
   *
   * 相当
   */
  ipcMain.handle(
    "updateManualStatus",
    async (
      _event,
      args: {
        kanriNo: string;
        status: JobStatus;
        comment: string;
      },
    ) => {
      updateManualStatus(args.kanriNo, args.status, args.comment);

      return {
        success: true,
      };
    },
  );
}

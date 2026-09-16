// electron/features/operation/operationIpc.ts

import fs from "node:fs";
import { dialog, ipcMain } from "electron";
import { executeScriptJob } from "@electron/features/operation/runners/scriptRunner";
import {
  runCycle,
  startPolling,
  stopPolling,
} from "@electron/features/operation/polling/pollingLoop";
import { setActiveFlags } from "@electron/features/operation/activeFlagsManager";
import {
  deleteAllStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  registerTargets,
  updateManualStatus,
} from "@electron/features/operation/statusManager";
import { syncTrackerStatus } from "@electron/features/operation/polling/trackerMonitor";
import type { JobResult, OperationItem } from "@shared/types/operation";

const cleanKanriNo = (val?: string | number): string =>
  String(val ?? "").trim();

async function runScriptWithZipRecovery(
  scriptId: string,
  filePath?: string | string[],
): Promise<JobResult> {
  try {
    return await executeScriptJob(scriptId, filePath);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const zipMatch = errorMessage.match(/([A-Z]:\\[^\r\n]+\.zip)/i);
    if (zipMatch?.[1]) {
      const zipPath = zipMatch[1];
      const response = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["削除して再実行", "キャンセル"],
        defaultId: 0,
        cancelId: 1,
        title: "ZIPファイル存在エラー",
        message:
          "出力先のZipファイルが既に存在します。削除して再実行しますか？",
        detail: zipPath,
      });

      if (response === 0) {
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
        return await executeScriptJob(scriptId, filePath);
      }
    }
    throw error;
  }
}

export function registerOperationIpc(): void {
  ipcMain.handle("registerTargets", (_, args) =>
    registerTargets(args?.items ?? []),
  );

  ipcMain.handle("setActiveFlags", (_, flags) => setActiveFlags(flags));

  ipcMain.handle("deleteAllJobStatuses", deleteAllStatuses);

  ipcMain.handle("initializeStatus", initializeStatuses);

  ipcMain.handle("updateJobStatus", (_, args) => {
    const kanriNo = cleanKanriNo(args?.kanriNo);
    if (!kanriNo || !args?.status) {
      throw new Error("Invalid parameters");
    }
    updateManualStatus(kanriNo, args.status, args.comment ?? "");
  });

  ipcMain.handle("startPolling", startPolling);

  ipcMain.handle("stopPolling", stopPolling);

  ipcMain.handle("executeScript", async (_, args) => {
    const scriptId = cleanKanriNo(args?.scriptId);
    if (!scriptId) {
      throw new Error("scriptId is required");
    }

    // 1. スクリプトの実行（SUCCESS / ERROR のステータス更新が内部で走る）
    const result = await runScriptWithZipRecovery(scriptId, args?.filePath);

    // 2. 【即時反映】60秒の定時ポーリングを待たず、即座に評価サイクルを回して依存ジョブをトリガー・通知
    void runCycle();

    return result;
  });

  ipcMain.handle(
    "fetchSingleJobStatus",
    async (_, args): Promise<OperationItem> => {
      const kanriNo = cleanKanriNo(args?.kanriNo);
      if (!kanriNo) {
        throw new Error("kanriNo is required");
      }

      const target = getTargetByKanriNo(kanriNo);
      if (!target) {
        throw new Error(`Target not found (kanriNo=${kanriNo})`);
      }

      // 🎯 統一された API エントリーポイント経由で直接同期・最新結果を取得
      return await syncTrackerStatus(target);
    },
  );
}

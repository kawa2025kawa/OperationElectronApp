import fs from "node:fs";
import { dialog, ipcMain } from "electron";
import { executeScriptJob } from "@electron/features/operation/runners/scriptRunner";
import {
  startPolling,
  stopPolling,
} from "@electron/features/operation/services/operationScheduler";
import { setActiveFlags } from "@electron/features/operation/activeFlagsManager";
import {
  deleteAllStatuses,
  getTargetByKanriNo,
  initializeStatuses,
  registerTargets,
  resetAllStatusesToScheduled,
  updateManualStatus,
} from "@electron/features/operation/statusManager";
import { syncTrackerStatus } from "@electron/features/operation/services/trackerServiceClient";
import {
  loadMasterCache,
  saveMasterCache,
} from "@electron/features/operation/services/operationMasterService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  JobResult,
  OperationItem,
} from "@shared/types/operation/operationTypes";

async function runScriptWithZipRecovery(
  scriptId: string,
  filePath?: string | string[],
): Promise<JobResult> {
  try {
    return await executeScriptJob(scriptId, filePath);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

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
  ipcMain.handle(IPC_CHANNELS.OPERATION.REGISTER_TARGETS, () => {
    const cache = loadMasterCache();

    if (!cache) {
      return { success: true };
    }

    registerTargets([
      ...cache.operations,
      ...cache.todayIrregulars,
    ]);

    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.SYNC_MASTER, (_, args) => {
    const {
      operations = [],
      irregulars = [],
      todayIrregulars = [],
    } = args ?? {};

    saveMasterCache({
      operations,
      irregulars,
      todayIrregulars,
    });

    registerTargets([
      ...operations,
      ...todayIrregulars,
    ]);

    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.LOAD_MASTER_CACHE, () =>
    loadMasterCache(),
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.RESET_STATUSES, async (_, args) => {
    const {
      operations = [],
      irregulars = [],
      todayIrregulars = [],
    } = args ?? {};

    saveMasterCache({
      operations,
      irregulars,
      todayIrregulars,
    });

    const allTargets: OperationItem[] = [
      ...operations,
      ...todayIrregulars,
    ];

    const updatedTargets = resetAllStatusesToScheduled(allTargets);

    return {
      success: true,
      data: updatedTargets,
    };
  });

  ipcMain.handle(IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS, (_, flags) =>
    setActiveFlags(flags),
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES,
    deleteAllStatuses,
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.INITIALIZE_STATUS,
    initializeStatuses,
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, (_, args) => {
    if (!args?.kanriNo || !args?.status) {
      throw new Error("Invalid parameters");
    }

    updateManualStatus(
      String(args.kanriNo),
      args.status,
      args.comment ?? "",
    );
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.START_POLLING,
    startPolling,
  );

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.STOP_POLLING,
    stopPolling,
  );

  ipcMain.handle(IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT, async (_, args) => {
    const scriptId = String(args?.scriptId ?? "");

    if (!scriptId) {
      throw new Error("scriptId is required");
    }

    return await runScriptWithZipRecovery(
      scriptId,
      args?.filePath,
    );
  });

  ipcMain.handle(
    IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS,
    async (_, args): Promise<OperationItem> => {
      const kanriNo = String(args?.kanriNo ?? "");

      if (!kanriNo) {
        throw new Error("kanriNo is required");
      }

      const target = getTargetByKanriNo(kanriNo);

      if (!target) {
        throw new Error(
          `Target not found (kanriNo=${kanriNo})`,
        );
      }

      return await syncTrackerStatus(target);
    },
  );
}
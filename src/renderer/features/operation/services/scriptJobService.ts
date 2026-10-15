// src/renderer/features/operation/services/scriptJobService.ts

import { toast } from "sonner";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";

export type ScriptFilePath = string | string[];

export async function executeScriptJob(
  state: AppState,
  kanriNo: string,
  scriptKey: string,
  filePath?: ScriptFilePath,
  options?: JobExecutionOptions,
): Promise<JobResult> {
  const cleanKanriNo = kanriNo.trim();
  const cleanScriptKey = scriptKey.trim();

  return runJobWithGlobalProcessing(
    state,
    "処理実行中...",
    cleanKanriNo,
    async (): Promise<JobResult> => {
      try {
        return await window.electronAPI.invoke(
          IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT,
          {
            kanriNo: cleanKanriNo,
            scriptKey: cleanScriptKey,
            filePath,
            ignoreDependencies: options?.ignoreDependencies,
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!options?.silent) {
          toast.error(`実行エラー: ${message}`);
        }
        throw error;
      }
    },
  );
}

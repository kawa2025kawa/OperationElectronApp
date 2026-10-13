// src/renderer/features/operation/services/jcJobService.ts

import { toast } from "sonner";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";

export async function executeJcJob(
  state: AppState,
  kanriNo: string,
  options?: { silent?: boolean },
): Promise<void> {
  const cleanKanriNo = kanriNo.trim();

  await runJobWithGlobalProcessing(
    state,
    "JC 実行中...",
    cleanKanriNo,
    async () => {
      try {
        const result = await trpc.operation.fetchSingleStatus.mutate({
          kanriNo: cleanKanriNo,
        });
        if (!result) {
          throw new Error(`No.${cleanKanriNo} のステータス取得に失敗しました`);
        }
        if (!options?.silent) {
          toast.info(`No.${cleanKanriNo} JCステータスを更新しました`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorMessage = `JC 実行エラー: ${message}`;
        if (!options?.silent) {
          toast.error(errorMessage);
        }
        throw error;
      }
    },
  );
}

// electron/features/operation/helpers/zipRecoveryHelper.ts

import fs from "node:fs/promises";
import { dialog } from "electron";
import {
  executeSingleScriptJob,
  type ScriptFilePath,
} from "@electron/features/operation/runners/scriptRunner";
import type { JobResult } from "@shared/types/operation/operationTypes";

/**
 * エラーメッセージからZIPファイルのパスを抽出
 */
export function extractZipPath(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/([A-Z]:\\[^\r\n]+\.zip)/i);
  return match?.[1] ?? null;
}

/**
 * 破損ZIPの削除確認ダイアログを表示
 */
export function confirmZipRecovery(zipPath: string): boolean {
  const response = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["削除して再実行", "キャンセル"],
    defaultId: 0,
    cancelId: 1,
    title: "ZIP破損検出",
    message: "破損したZIPファイルを削除して再作成しますか？",
    detail: zipPath,
  });
  return response === 0;
}

/**
 * スクリプト実行（ZIP破損検知時に自動リカバリを挟む）
 */
export async function runScriptWithZipRecovery(
  kanriNo: string,
  scriptKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  try {
    return await executeSingleScriptJob(kanriNo, scriptKey, filePath);
  } catch (error: unknown) {
    const zipPath = extractZipPath(error);
    if (!zipPath || !confirmZipRecovery(zipPath)) {
      throw error;
    }

    try {
      await fs.unlink(zipPath);
    } catch {}

    return executeSingleScriptJob(kanriNo, scriptKey, filePath);
  }
}

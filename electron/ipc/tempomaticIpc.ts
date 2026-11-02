// electron/ipc/tempomaticIpc.ts

import { ipcMain } from "electron";
import { addDays, format } from "date-fns";
import fs from "fs-extra";
import path from "node:path";
import {
  uploadPdfDocuments,
  type TempomaticTargetFile,
} from "@electron/features/tempomatic/tempomaticService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// 指定日数後の有効期限日付文字列（yyyy/MM/dd）を算出する。
function calculateExpireDate(offsetDays = 7): string {
  const date = addDays(new Date(), offsetDays);
  return format(date, "yyyy/MM/dd");
}

// TempomaticへのPDF帳票アップロードに関するIPCハンドラーを登録する。
export function registerTempomaticIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT,
    async (
      _event,
      params: IpcChannelMap[typeof IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT]["return"]
    > => {
      const rawTargets: TempomaticTargetFile[] = [];

      // files が渡された場合
      if (params.files && Array.isArray(params.files)) {
        for (const item of params.files) {
          if (item?.path?.trim()) {
            rawTargets.push({
              path: item.path.trim(),
              name: item.name?.trim(),
            });
          }
        }
      }
      // 従来の filePaths が渡された場合のフォールバック
      else if (params.filePaths && Array.isArray(params.filePaths)) {
        for (const p of params.filePaths) {
          if (p?.trim()) {
            rawTargets.push({
              path: p.trim(),
            });
          }
        }
      }

      // パスの重複排除
      const visitedPaths = new Set<string>();
      const uniqueTargets = rawTargets.filter((item) => {
        if (visitedPaths.has(item.path)) {
          return false;
        }
        visitedPaths.add(item.path);
        return true;
      });

      const validPdfTargets = uniqueTargets.filter((item) =>
        item.path.toLowerCase().endsWith(".pdf"),
      );

      if (validPdfTargets.length === 0) {
        throw new Error(
          "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
        );
      }

      // ローカルディスク上のファイル存在確認（元ファイルが存在するか）
      for (const target of validPdfTargets) {
        if (!(await fs.pathExists(target.path))) {
          throw new Error(
            `指定されたファイルが存在しません: ${path.basename(target.path)}`,
          );
        }
      }

      const expireDate = params.expireDate?.trim()
        ? params.expireDate.trim()
        : calculateExpireDate();

      return uploadPdfDocuments(validPdfTargets, expireDate);
    },
  );
}

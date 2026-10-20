// electron/ipc/tempomaticIpc.ts

import { ipcMain } from "electron";
import { addDays, format } from "date-fns";
import fs from "fs-extra";
import path from "node:path";
import { uploadPdfDocuments } from "@electron/features/tempomatic/tempomaticService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

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
      params: {
        filePaths: string[];
        expireDate?: string;
      },
    ): Promise<string> => {
      const uniquePaths = Array.from(
        new Set(params.filePaths.map((p) => p.trim())),
      ).filter(Boolean);
      const validPdfPaths = uniquePaths.filter((p) =>
        p.toLowerCase().endsWith(".pdf"),
      );

      if (validPdfPaths.length === 0) {
        throw new Error(
          "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
        );
      }

      for (const filePath of validPdfPaths) {
        if (!(await fs.pathExists(filePath))) {
          throw new Error(
            `指定されたファイルが存在しません: ${path.basename(filePath)}`,
          );
        }
      }

      const expireDate = params.expireDate?.trim()
        ? params.expireDate.trim()
        : calculateExpireDate();

      return uploadPdfDocuments(validPdfPaths, expireDate);
    },
  );
}

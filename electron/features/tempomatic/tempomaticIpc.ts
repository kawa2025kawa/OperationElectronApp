// electron/features/tempomatic/tempomaticIpc.ts

import { ipcMain } from "electron";
import { uploadPdfDocuments } from "./tempomaticService";

type TempomaticUploadDocumentParams = {
  filePaths: string[];
  expireDate: string;
};

export function registerTempomaticIpc(): void {
  ipcMain.handle(
    "tempomatic:uploadDocument",
    async (
      _event,
      { filePaths, expireDate }: TempomaticUploadDocumentParams,
    ): Promise<string> => {
      return uploadPdfDocuments(filePaths, expireDate);
    },
  );
}

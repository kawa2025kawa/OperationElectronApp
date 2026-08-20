﻿//src\shared\store\slices\services\pdfUploadService.ts

import { commands } from "@shared/api/commands";
import { getFileName } from "@shared/utils/fileUtils";
import type { ValidatedPdf } from "../pdfUploadSlice";

export interface PdfUploadRequest {
  filePaths: string[];
  expireDate: string;
}

const logUploadSequence = (filePaths: string[]): void => {
  console.log(
    "[PdfUploadService] upload sequence:",
    filePaths.map((filePath, index) => ({
      index: index + 1,
      fileName: getFileName(filePath),
      filePath,
    })),
  );
};

export const pdfUploadService = {
  async upload(files: ValidatedPdf[], expireDate: string): Promise<void> {
    if (files.length === 0) {
      throw new Error("アップロード対象のPDFファイルがありません");
    }

    if (!expireDate) {
      throw new Error("PDFアップロードの有効期限が指定されていません");
    }

    const filePaths = files.map((file) => file.path);
    logUploadSequence(filePaths);

    await commands.tempomaticUploadDocument(filePaths, expireDate);
  },
};

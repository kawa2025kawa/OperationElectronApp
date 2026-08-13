// src/shared/store/slices/services/pdfUploadService.ts

import { commands } from "@shared/api/commands";

import type { ValidatedPdf } from "../pdfUploadSlice";

// ============================================================
// Types
// ============================================================

export interface PdfUploadRequest {
  filePaths: string[];
  expireDate: string;
}

// ============================================================
// Helpers
// ============================================================

const getFileName = (filePath: string): string =>
  filePath.split(/[/\\]/).pop() ?? filePath;

const createUploadRequest = (
  files: ValidatedPdf[],
  expireDate: string,
): PdfUploadRequest => ({
  filePaths: files.map((file) => file.path),
  expireDate,
});

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

// ============================================================
// Service
// ============================================================

export const pdfUploadService = {
  async upload(files: ValidatedPdf[], expireDate: string): Promise<void> {
    if (files.length === 0) {
      throw new Error("アップロード対象のPDFファイルがありません");
    }

    if (!expireDate) {
      throw new Error("PDFアップロードの有効期限が指定されていません");
    }

    const request = createUploadRequest(files, expireDate);

    logUploadSequence(request.filePaths);

    await commands.tempomaticUploadDocument(
      request.filePaths,
      request.expireDate,
    );
  },
};

// src/shared/store/slices/utils/pdfUploadUtils.ts

import type { ValidatedPdf, PdfUploadState } from "../pdfUploadSlice";

const DEFAULT_EXPIRE_OFFSET_DAYS = 7;

export const calculateExpireDate = (
  offsetDays = DEFAULT_EXPIRE_OFFSET_DAYS,
): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10).replace(/-/g, "/");
};

export const getFileName = (filePath: string): string =>
  filePath.split(/[/\\]/).pop() ?? filePath;

export const validateAndFormatPdfs = (
  incomingPaths: string[],
): ValidatedPdf[] =>
  incomingPaths
    .filter((filePath) => filePath.toLowerCase().endsWith(".pdf"))
    .map((filePath) => ({
      name: getFileName(filePath),
      path: filePath,
    }));

export const createInitialPdfUploadState = (): PdfUploadState => ({
  step: "dnd",
  resultState: "idle",
  errorMessage: "",
  files: [],
  isProcessing: false,
  isDragging: false,
  expireDate: calculateExpireDate(),
});

export const createUniquePaths = (
  currentPaths: string[],
  incomingPaths: string[],
): string[] => Array.from(new Set([...currentPaths, ...incomingPaths]));

export const logUploadOrder = (label: string, files: ValidatedPdf[]): void => {
  console.log(
    `[PdfUpload] ${label}:`,
    files.map((file, index) => ({
      index: index + 1,
      name: file.name,
      path: file.path,
    })),
  );
};

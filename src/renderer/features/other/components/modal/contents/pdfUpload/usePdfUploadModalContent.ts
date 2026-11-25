// src/renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { FileDropZoneItem } from "@renderer/components/ui/fileDropZone/fileDropZoneTypes";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { otherIpcService, systemIpcService } from "@renderer/services/ipcServices";
import {
  toErrorMessage,
  toResolvedFileItem,
} from "@renderer/utils/rendererUtils";
import { MODAL_TITLES } from "@shared/types/ui/modal";

interface PdfMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const PDF_UPLOAD_MESSAGES = {
  INITIAL: "PDFファイルをドラッグ＆ドロップまたは選択してください。",
  PROCESSING: "PDF処理中...",
  SUCCESS: "PDFのアップロードが完了しました。",
  SUCCESS_TOAST: "PDFアップロード完了",
  FAILED_PREFIX: "アップロード失敗: ",
  selectedCount: (count: number) =>
    `${count} 件のPDFファイルが選択されています。`,
  invalidFiles: (names: string) => `対象外のファイルが含まれています: ${names}`,
  unavailablePaths: (names: string) =>
    `ファイルパスを取得できないファイルがあります: ${names}`,
} as const;

const INITIAL_MESSAGE: PdfMessage = {
  text: PDF_UPLOAD_MESSAGES.INITIAL,
  type: "info",
};

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function usePdfUploadModalContent() {
  const [files, setFiles] = useState<FileDropZoneItem[]>([]);
  const [infoMessage, setInfoMessage] = useState<PdfMessage>(INITIAL_MESSAGE);
  const [isBusy, setIsBusy] = useState(false);

  const isBusyRef = useRef(false);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const runExclusive = useCallback(async (task: () => Promise<void>) => {
    if (isBusyRef.current) return;

    isBusyRef.current = true;
    setIsBusy(true);
    try {
      await task();
    } finally {
      isBusyRef.current = false;
      setIsBusy(false);
    }
  }, []);

  const addPdfFiles = useCallback((rawFiles: File[]) => {
    if (isBusyRef.current || rawFiles.length === 0) return;

    const incomingFiles: FileDropZoneItem[] = [];
    const invalidNames: string[] = [];
    const unavailableNames: string[] = [];

    for (const file of rawFiles) {
      if (!isPdfFile(file)) {
        invalidNames.push(file.name);
        continue;
      }

      const resolved = toResolvedFileItem(file);
      if (!resolved) {
        unavailableNames.push(file.name);
        continue;
      }

      incomingFiles.push(resolved);
    }

    const errorMessages: string[] = [];
    if (invalidNames.length > 0) {
      errorMessages.push(
        PDF_UPLOAD_MESSAGES.invalidFiles(invalidNames.join(", ")),
      );
    }
    if (unavailableNames.length > 0) {
      errorMessages.push(
        PDF_UPLOAD_MESSAGES.unavailablePaths(unavailableNames.join(", ")),
      );
    }

    setFiles((currentFiles) => {
      const existingPaths = new Set(currentFiles.map((file) => file.path));
      const newFiles = incomingFiles.filter((file) => {
        if (existingPaths.has(file.path)) return false;
        existingPaths.add(file.path);
        return true;
      });

      const nextFiles = [...currentFiles, ...newFiles];
      setInfoMessage(
        errorMessages.length > 0
          ? { text: errorMessages.join(" / "), type: "error" }
          : {
              text: PDF_UPLOAD_MESSAGES.selectedCount(nextFiles.length),
              type: "info",
            },
      );

      return nextFiles;
    });
  }, []);

  const handleRenameFile = useCallback(
    (filePath: string, newName: string) =>
      runExclusive(async () => {
        if (!filesRef.current.some((file) => file.path === filePath)) return;

        try {
          const result = await systemIpcService.renameFile(filePath, newName);

          setFiles((currentFiles) =>
            currentFiles.map((file) =>
              file.path === filePath
                ? { ...file, name: newName, path: result.newPath }
                : file,
            ),
          );

          toast.success(`ファイル名を「${newName}」に変更しました`);
        } catch (error: unknown) {
          console.error("[PdfUpload] Failed to rename file:", error);
          toast.error(`リネーム失敗: ${toErrorMessage(error)}`);
        }
      }),
    [runExclusive],
  );

  const handleFileReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (isBusyRef.current) return;

      setFiles((currentFiles) => {
        if (
          fromIndex < 0 ||
          fromIndex >= currentFiles.length ||
          toIndex < 0 ||
          toIndex >= currentFiles.length ||
          fromIndex === toIndex
        ) {
          return currentFiles;
        }

        const nextFiles = [...currentFiles];
        const [movedFile] = nextFiles.splice(fromIndex, 1);
        if (!movedFile) return currentFiles;

        nextFiles.splice(toIndex, 0, movedFile);
        return nextFiles;
      });
    },
    [],
  );

  const handleRemoveFile = useCallback((index: number) => {
    if (isBusyRef.current) return;

    setFiles((currentFiles) => {
      if (index < 0 || index >= currentFiles.length) return currentFiles;

      const nextFiles = currentFiles.filter(
        (_, fileIndex) => fileIndex !== index,
      );

      setInfoMessage({
        text: PDF_UPLOAD_MESSAGES.selectedCount(nextFiles.length),
        type: "info",
      });

      return nextFiles;
    });
  }, []);

  const handleExecuteUpload = useCallback(
    () =>
      runExclusive(async () => {
        if (filesRef.current.length === 0) return;

        const filesToUpload = filesRef.current.map(({ path, name }) => ({
          path,
          name,
        }));

        try {
          await runJobWithGlobalProcessing(
            PDF_UPLOAD_MESSAGES.PROCESSING,
            MODAL_TITLES.PDF_UPLOAD,
            () =>
              otherIpcService.uploadTempomaticPdf({
                files: filesToUpload,
              }),
          );

          setFiles([]);
          setInfoMessage({
            text: PDF_UPLOAD_MESSAGES.SUCCESS,
            type: "success",
          });
          toast.success(PDF_UPLOAD_MESSAGES.SUCCESS_TOAST);
        } catch (error: unknown) {
          const message = toErrorMessage(error);
          console.error("[PdfUpload] upload failed:", error);
          setInfoMessage({
            text: `${PDF_UPLOAD_MESSAGES.FAILED_PREFIX}${message}`,
            type: "error",
          });
          toast.error(message);
        }
      }),
    [runExclusive],
  );

  useModalFooterSync({
    message: infoMessage,
    executeLabel: "アップロード実行",
    isExecuteDisabled: files.length === 0 || isBusy,
    onExecute: handleExecuteUpload,
  });

  return {
    files,
    isBusy,
    addPdfFiles,
    handleRenameFile,
    handleFileReorder,
    handleRemoveFile,
  };
}

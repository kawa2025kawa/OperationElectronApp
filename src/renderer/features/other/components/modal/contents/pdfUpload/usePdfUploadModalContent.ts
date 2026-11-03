// src/renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { otherIpcService } from "@renderer/services/otherIpcService";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore } from "@renderer/store";
import type { FileDropZoneItem } from "@renderer/components/ui/fileDropZone/fileDropZoneTypes";
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
} as const;

const PDF_UPLOAD_ACTIONS = {
  CANCEL: {
    id: "cancel",
    label: "キャンセル",
  },
  UPLOAD: {
    id: "upload",
    label: "アップロード実行",
  },
} as const;

const INITIAL_MESSAGE: PdfMessage = {
  text: PDF_UPLOAD_MESSAGES.INITIAL,
  type: "info",
};

export function usePdfUploadModalContent() {
  const [files, setFiles] = useState<FileDropZoneItem[]>([]);
  const [infoMessage, setInfoMessage] = useState<PdfMessage>(INITIAL_MESSAGE);

  const updateModalConfig = useAppStore((state) => state.updateModalConfig);
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);

  const addPdfFiles = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;

    const invalidFiles = rawFiles.filter(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf"),
    );
    const validFiles = rawFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    const incomingFiles = validFiles
      .map((file) => {
        const filePath =
          window.electronAPI.getFilePath(file) ||
          ("path" in file && typeof file.path === "string"
            ? file.path
            : file.name);
        if (!filePath) return null;
        return {
          name: file.name || filePath.split(/[/\\]/).pop() || filePath,
          path: filePath,
        };
      })
      .filter((file): file is FileDropZoneItem => file !== null);

    setFiles((currentFiles) => {
      const existingPaths = new Set(currentFiles.map((file) => file.path));
      const newFiles = incomingFiles.filter(
        (file) => !existingPaths.has(file.path),
      );
      const nextFiles = [...currentFiles, ...newFiles];

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map((file) => file.name).join(", ");
        setInfoMessage({
          text: PDF_UPLOAD_MESSAGES.invalidFiles(invalidNames),
          type: "error",
        });
      } else {
        setInfoMessage({
          text: PDF_UPLOAD_MESSAGES.selectedCount(nextFiles.length),
          type: "info",
        });
      }
      return nextFiles;
    });
  }, []);

  const handleRenameFile = useCallback(
    async (index: number, newName: string) => {
      const currentTarget = files[index];
      if (!currentTarget || !currentTarget.path) return;

      try {
        const result = await systemIpcService.renameFile(
          currentTarget.path,
          newName,
        );

        setFiles((currentFiles) => {
          if (index < 0 || index >= currentFiles.length) return currentFiles;
          const target = currentFiles[index];
          if (!target) return currentFiles;

          const nextFiles = [...currentFiles];
          nextFiles[index] = {
            ...target,
            name: newName,
            path: result.newPath,
          };
          return nextFiles;
        });

        toast.success(`ファイル名を「${newName}」に変更しました`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[PdfUpload] Failed to rename file:", error);
        toast.error(`リネーム失敗: ${message}`);
      }
    },
    [files],
  );

  const handleFileReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
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
    setFiles((currentFiles) => {
      if (index < 0 || index >= currentFiles.length) {
        return currentFiles;
      }
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

  const handleExecuteUpload = useCallback(async () => {
    if (files.length === 0) return;
    const filesToUpload = [...files];

    try {
      await runJobWithGlobalProcessing(
        PDF_UPLOAD_MESSAGES.PROCESSING,
        MODAL_TITLES.PDF_UPLOAD,
        async () => {
          await otherIpcService.uploadTempomaticPdf({
            files: filesToUpload.map((file) => ({
              path: file.path,
              name: file.name,
            })),
          });
        },
      );
      setFiles([]);
      setInfoMessage({
        text: PDF_UPLOAD_MESSAGES.SUCCESS,
        type: "success",
      });
      toast.success(PDF_UPLOAD_MESSAGES.SUCCESS_TOAST);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[PdfUpload] upload failed:", error);
      setInfoMessage({
        text: `${PDF_UPLOAD_MESSAGES.FAILED_PREFIX}${message}`,
        type: "error",
      });
      toast.error(message);
    }
  }, [files]);

  // モーダルのヘッダーメッセージおよびフッターボタンの同期
  useEffect(() => {
    updateModalConfig({
      message: infoMessage,
      leftActions: [
        {
          id: PDF_UPLOAD_ACTIONS.CANCEL.id,
          label: PDF_UPLOAD_ACTIONS.CANCEL.label,
          onClick: closeGlobalModal,
        },
      ],
      rightActions: [
        {
          id: PDF_UPLOAD_ACTIONS.UPLOAD.id,
          label: PDF_UPLOAD_ACTIONS.UPLOAD.label,
          onClick: handleExecuteUpload,
          disabled: files.length === 0,
          variant: "default",
        },
      ],
    });
  }, [
    infoMessage,
    files.length,
    handleExecuteUpload,
    closeGlobalModal,
    updateModalConfig,
  ]);

  return {
    files,
    addPdfFiles,
    handleRenameFile,
    handleFileReorder,
    handleRemoveFile,
  };
}

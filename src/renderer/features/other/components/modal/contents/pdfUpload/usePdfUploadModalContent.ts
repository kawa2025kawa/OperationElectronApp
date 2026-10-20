// src/renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@renderer/store";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { otherIpcService } from "@renderer/services/otherIpcService";

interface ValidatedPdf {
  name: string;
  path: string;
}

interface PdfMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const INITIAL_MESSAGE: PdfMessage = {
  text: "アップロードするPDFファイルをドラッグ＆ドロップしてください。",
  type: "info",
};

export function usePdfUploadModalContent() {
  const [files, setFiles] = useState<ValidatedPdf[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
          name: filePath.split(/[/\\]/).pop() ?? filePath,
          path: filePath,
        };
      })
      .filter((file): file is ValidatedPdf => file !== null);

    setFiles((currentFiles) => {
      const existingPaths = new Set(currentFiles.map((file) => file.path));

      const newFiles = incomingFiles.filter(
        (file) => !existingPaths.has(file.path),
      );

      const nextFiles = [...currentFiles, ...newFiles];

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map((file) => file.name).join(", ");

        setInfoMessage({
          text: `PDF以外のファイルが含まれていたためスキップしました: ${invalidNames}`,
          type: "error",
        });
      } else {
        setInfoMessage({
          text: `${nextFiles.length}件のPDFファイルが選択されています。`,
          type: "info",
        });
      }

      return nextFiles;
    });
  }, []);

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

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (isProcessing) return;

      setFiles((currentFiles) => {
        if (index < 0 || index >= currentFiles.length) {
          return currentFiles;
        }

        const nextFiles = currentFiles.filter(
          (_, fileIndex) => fileIndex !== index,
        );

        setInfoMessage({
          text: `${nextFiles.length}件のPDFファイルが選択されています。`,
          type: "info",
        });

        return nextFiles;
      });
    },
    [isProcessing],
  );

  const handleExecuteUpload = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;

    const filesToUpload = [...files];

    setIsProcessing(true);
    setInfoMessage({
      text: "PDFファイルをアップロードしています...",
      type: "info",
    });

    try {
      await runJobWithGlobalProcessing(
        useAppStore.getState(),
        "PDF送信中...",
        "Tempomatic PDF",
        async () => {
          await otherIpcService.uploadTempomaticPdf({
            filePaths: filesToUpload.map((file) => file.path),
          });
        },
      );

      setFiles([]);
      setInfoMessage({
        text: "PDFのアップロードが完了しました。",
        type: "success",
      });

      toast.success("PDFのアップロードが完了しました");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("[PdfUpload] upload failed:", error);

      setInfoMessage({
        text: `アップロードに失敗しました: ${message}`,
        type: "error",
      });

      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [files, isProcessing]);

  useEffect(() => {
    updateModalConfig({
      message: infoMessage,
      leftActions: [
        {
          id: "cancel",
          label: "閉じる",
          onClick: closeGlobalModal,
          disabled: isProcessing,
        },
      ],
      rightActions: [
        {
          id: "upload",
          label: isProcessing ? "処理中..." : "アップロード",
          onClick: handleExecuteUpload,
          disabled: files.length === 0 || isProcessing,
          variant: "default",
        },
      ],
    });
  }, [
    infoMessage,
    files.length,
    isProcessing,
    handleExecuteUpload,
    closeGlobalModal,
    updateModalConfig,
  ]);

  return {
    files,
    isProcessing,
    addPdfFiles,
    handleFileReorder,
    handleRemoveFile,
  };
}

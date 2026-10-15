// src/renderer/features/other/store/pdfUploadSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";

export interface ValidatedPdf {
  name: string;
  path: string;
}

// 統一されたメッセージ型
export interface PdfMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

export interface PdfUploadState {
  step: "confirm" | "dnd";
  resultState: "idle" | "processing" | "success" | "error";
  errorMessage: string;
  files: ValidatedPdf[];
  isProcessing: boolean;
  isDragging: boolean;
  infoMessage: PdfMessage; // 常に表示するメッセージ状態
}

export interface PdfUploadSlice {
  pdfUpload: PdfUploadState;
  updatePdfUpload(update: Partial<PdfUploadState>): void;
  resetPdfUpload(): void;
  addPdfFiles(rawFiles: File[]): void;
  reorderPdfFiles(fromIndex: number, toIndex: number): void;
  uploadPdfFiles(): Promise<void>;
}

// ★ 初期状態から案内メッセージをセットしておくことで、最初から枠が出る
const createInitialPdfUploadState = (): PdfUploadState => ({
  step: "dnd",
  resultState: "idle",
  errorMessage: "",
  files: [],
  isProcessing: false,
  isDragging: false,
  infoMessage: {
    text: "アップロードするPDFファイルをドラッグ＆ドロップしてください。",
    type: "info",
  },
});

export const createPdfUploadSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  PdfUploadSlice
> = (set, get) => ({
  pdfUpload: createInitialPdfUploadState(),

  updatePdfUpload: (update) =>
    set((state) => {
      Object.assign(state.pdfUpload, update);
    }),

  resetPdfUpload: () =>
    set((state) => {
      state.pdfUpload = createInitialPdfUploadState();
    }),

  addPdfFiles: (rawFiles) => {
    if (rawFiles.length === 0) return;

    const invalidFiles = rawFiles.filter(
      (f) =>
        f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"),
    );

    const validFiles = rawFiles.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

    const incomingPaths = validFiles
      .map(
        (f) =>
          window.electronAPI.getFilePath(f) ||
          ("path" in f && typeof f.path === "string" ? f.path : f.name),
      )
      .filter(Boolean);

    set((state) => {
      const existingPaths = new Set(
        state.pdfUpload.files.map((file) => file.path),
      );
      const newFiles = incomingPaths
        .filter((p) => !existingPaths.has(p))
        .map((filePath) => ({
          name: filePath.split(/[/\\]/).pop() ?? filePath,
          path: filePath,
        }));

      const nextFiles = [...state.pdfUpload.files, ...newFiles];

      // ★ 状態に応じたメッセージを生成
      let nextInfoMessage: PdfMessage;
      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map((f) => f.name).join(", ");
        nextInfoMessage = {
          text: `PDF以外のファイルが含まれていたためスキップしました: ${invalidNames}`,
          type: "error", // 赤枠になる
        };
      } else {
        nextInfoMessage = {
          text: `${nextFiles.length}件のPDFファイルが選択されています。`,
          type: "info", // 青枠になる
        };
      }

      Object.assign(state.pdfUpload, {
        resultState: "idle",
        isProcessing: false,
        errorMessage: "",
        step: "dnd",
        files: nextFiles,
        infoMessage: nextInfoMessage,
      });
    });
  },

  reorderPdfFiles: (fromIndex, toIndex) =>
    set((state) => {
      const { files } = state.pdfUpload;
      const isInvalidIndex =
        fromIndex < 0 ||
        fromIndex >= files.length ||
        toIndex < 0 ||
        toIndex >= files.length ||
        fromIndex === toIndex;
      if (isInvalidIndex) return;
      const [movedFile] = files.splice(fromIndex, 1);
      if (!movedFile) return;
      files.splice(toIndex, 0, movedFile);
    }),

  uploadPdfFiles: async () => {
    const { files, isProcessing } = get().pdfUpload;
    if (files.length === 0 || isProcessing) return;

    set((state) => {
      Object.assign(state.pdfUpload, {
        resultState: "processing",
        isProcessing: true,
        errorMessage: "",
        infoMessage: {
          text: "PDFファイルをアップロードしています...",
          type: "info",
        },
      });
    });

    try {
      const state = get();
      await runJobWithGlobalProcessing(
        state,
        "PDF送信中...",
        "Tempomatic PDF",
        async () => {
          const filePaths = files.map((file) => file.path);
          await window.electronAPI.invoke(
            IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT,
            {
              filePaths,
            },
          );
        },
      );

      set((state) => {
        Object.assign(state.pdfUpload, {
          resultState: "success",
          files: [], // 成功時は空にする
          infoMessage: {
            text: "PDFのアップロードが完了しました。",
            type: "success", // 緑枠になる
          },
        });
      });
      toast.success("PDFのアップロードが完了しました");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[PdfUpload] upload failed:", error);
      set((state) => {
        Object.assign(state.pdfUpload, {
          resultState: "error",
          errorMessage: message,
          infoMessage: {
            text: `アップロードに失敗しました: ${message}`,
            type: "error", // 赤枠になる
          },
        });
      });
      toast.error(message);
      throw error;
    } finally {
      set((state) => {
        state.pdfUpload.isProcessing = false;
      });
    }
  },
});

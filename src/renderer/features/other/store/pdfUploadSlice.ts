import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/operationEntities";

import {
  calculateExpireDate,
  createInitialPdfUploadState,
  createUniquePaths,
  logUploadOrder,
  validateAndFormatPdfs,
} from "@renderer/features/other/store/utils/pdfUploadUtils";

// ============================================================
// Types
// ============================================================

export interface ValidatedPdf {
  name: string;
  path: string;
}

export interface PdfUploadState {
  step: "confirm" | "dnd";
  resultState: "idle" | "processing" | "success" | "error";
  errorMessage: string;
  files: ValidatedPdf[];
  isProcessing: boolean;
  isDragging: boolean;
  expireDate: string;
}

export interface PdfUploadSlice {
  pdfUpload: PdfUploadState;

  updatePdfUpload(update: Partial<PdfUploadState>): void;
  resetPdfUpload(): void;
  mergePdfFiles(incomingPaths: string[]): void;
  reorderPdfFiles(fromIndex: number, toIndex: number): void;
  uploadPdfFiles(): Promise<void>;
}

// ============================================================
// Slice
// ============================================================

export const createPdfUploadSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  PdfUploadSlice
> = (set, get) => ({
  pdfUpload: createInitialPdfUploadState(),

  // ==========================================================
  // Update
  // ==========================================================

  updatePdfUpload: (update) =>
    set((state) => {
      Object.assign(state.pdfUpload, update);
    }),

  // ==========================================================
  // Reset
  // ==========================================================

  resetPdfUpload: () =>
    set((state) => {
      state.pdfUpload = createInitialPdfUploadState();
    }),

  // ==========================================================
  // Merge Files
  // ==========================================================

  mergePdfFiles: (incomingPaths) => {
    const currentPaths = get().pdfUpload.files.map((file) => file.path);

    const mergedPaths = createUniquePaths(currentPaths, incomingPaths);
    const files = validateAndFormatPdfs(mergedPaths);

    logUploadOrder("merged file order", files);

    set((state) => {
      Object.assign(state.pdfUpload, {
        resultState: "idle",
        isProcessing: false,
        errorMessage: "",
        step: "dnd",
        files,
        expireDate: calculateExpireDate(),
      });
    });
  },

  // ==========================================================
  // Reorder Files
  // ==========================================================

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

      logUploadOrder("reordered file order", files);
    }),

  // ==========================================================
  // Upload
  // ==========================================================

  uploadPdfFiles: async () => {
    const { files, expireDate, isProcessing } = get().pdfUpload;

    if (files.length === 0 || isProcessing) {
      console.warn("[PdfUpload] upload blocked", {
        fileCount: files.length,
        isProcessing,
      });
      return;
    }

    if (!expireDate) {
      throw new Error("PDFアップロードの有効期限が指定されていません");
    }

    logUploadOrder("final upload order", files);

    set((state) => {
      Object.assign(state.pdfUpload, {
        resultState: "processing",
        isProcessing: true,
        errorMessage: "",
      });
    });

    try {
      const state = get();

      await runJobWithGlobalProcessing(
        state,
        "PDFアップロード中...",
        "店舗maticPDFアップロード",
        async () => {
          const filePaths = files.map((file) => file.path);
          await commands.tempomaticUploadDocument(filePaths, expireDate);
        },
      );

      set((state) => {
        state.pdfUpload.resultState = "success";
      });

      toast.success("PDFアップロード完了");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[PdfUpload] upload failed:", error);

      set((state) => {
        Object.assign(state.pdfUpload, {
          resultState: "error",
          errorMessage: message,
        });
      });

      toast.error("PDFアップロードに失敗しました。");
      throw error;
    } finally {
      set((state) => {
        state.pdfUpload.isProcessing = false;
      });
    }
  },
});

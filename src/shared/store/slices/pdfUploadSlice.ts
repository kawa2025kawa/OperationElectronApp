﻿// src/shared/store/slices/pdfUploadSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";
import { pdfUploadService } from "@shared/store/slices/services/pdfUploadService";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import {
  createInitialPdfUploadState,
  createUniquePaths,
  validateAndFormatPdfs,
  calculateExpireDate,
  logUploadOrder,
} from "./utils/pdfUploadUtils";

// --- Types ---
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
  runPdfUploadJob(): Promise<void>;
}

// --- Slice ---
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

  reorderPdfFiles: (fromIndex, toIndex) =>
    set((state) => {
      const files = state.pdfUpload.files;
      if (
        fromIndex < 0 ||
        fromIndex >= files.length ||
        toIndex < 0 ||
        toIndex >= files.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const [movedFile] = files.splice(fromIndex, 1);
      if (movedFile) {
        files.splice(toIndex, 0, movedFile);
        logUploadOrder("reordered file order", files);
      }
    }),

  uploadPdfFiles: async () => {
    const { files, expireDate, isProcessing } = get().pdfUpload;
    if (files.length === 0 || isProcessing) return;

    logUploadOrder("final upload order", files);

    set((state) => {
      Object.assign(state.pdfUpload, {
        resultState: "processing",
        isProcessing: true,
        errorMessage: "",
      });
    });

    try {
      await pdfUploadService.upload(files, expireDate);

      const activeItem = selectActiveItemStatusFlags(get()).item;
      const kanriNo = activeItem?.kanriNo
        ? String(activeItem.kanriNo).trim()
        : "30";

      await get().runScriptJob(kanriNo);

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
      toast.error(
        "PDFアップロードに失敗しました。F12コンソールを確認してください。",
      );
      throw error;
    } finally {
      set((state) => {
        state.pdfUpload.isProcessing = false;
      });
    }
  },

  runPdfUploadJob: () => get().uploadPdfFiles(),
});

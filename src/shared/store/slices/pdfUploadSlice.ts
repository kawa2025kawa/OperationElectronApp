// src/shared/store/slices/pdfUploadSlice.ts
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";
import { unwrapResult } from "@shared/utils/apiUtils";

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

const calculateExpireDate = (offsetDays = 7): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, "/");
};

const validateAndFormatPdfs = (incomingPaths: string[]): ValidatedPdf[] => {
  return incomingPaths
    .filter((path) => path.toLowerCase().endsWith(".pdf"))
    .map((path) => ({
      name: path.split(/[/\\]/).pop() ?? path,
      path,
    }));
};

const INITIAL_PDF_UPLOAD: PdfUploadState = {
  step: "dnd",
  resultState: "idle",
  errorMessage: "",
  files: [],
  isProcessing: false,
  isDragging: false,
  expireDate: calculateExpireDate(7),
};

export const createPdfUploadSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  PdfUploadSlice
> = (set, get) => ({
  pdfUpload: INITIAL_PDF_UPLOAD,

  updatePdfUpload: (update: Partial<PdfUploadState>) =>
    set((s: AppState) => {
      Object.assign(s.pdfUpload, update);
    }),

  resetPdfUpload: () =>
    set((s: AppState) => {
      s.pdfUpload = {
        ...INITIAL_PDF_UPLOAD,
        expireDate: calculateExpireDate(7),
      };
    }),

  mergePdfFiles: (incomingPaths: string[]) => {
    const uniquePaths = Array.from(
      new Set([
        ...get().pdfUpload.files.map((f: ValidatedPdf) => f.path),
        ...incomingPaths,
      ]),
    );
    set((s: AppState) => {
      Object.assign(s.pdfUpload, {
        resultState: "idle",
        isProcessing: false,
        step: "dnd",
        files: validateAndFormatPdfs(uniquePaths),
        expireDate: calculateExpireDate(7),
      });
    });
  },

  reorderPdfFiles: (fromIndex: number, toIndex: number) => {
    set((s: AppState) => {
      const files = s.pdfUpload.files;
      if (
        fromIndex < 0 ||
        fromIndex >= files.length ||
        toIndex < 0 ||
        toIndex >= files.length
      ) {
        return;
      }
      const [movedItem] = files.splice(fromIndex, 1);
      files.splice(toIndex, 0, movedItem);
    });
  },

  uploadPdfFiles: async () => {
    const { files, expireDate } = get().pdfUpload;
    if (files.length === 0) return;

    set((s: AppState) => {
      Object.assign(s.pdfUpload, {
        resultState: "processing",
        isProcessing: true,
        errorMessage: "",
      });
    });

    try {
      const res = await window.electronAPI.invoke<unknown>(
        "tempomaticUploadDocument",
        {
          filePaths: files.map((f: ValidatedPdf) => f.path),
          expireDate,
        },
      );
      unwrapResult(res, "PDFアップロード処理に失敗しました");
      toast.success("PDFアップロード完了");

      set((s: AppState) => {
        s.pdfUpload.resultState = "success";
      });
    } catch (error: unknown) {
      set((s: AppState) => {
        Object.assign(s.pdfUpload, {
          resultState: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      });
      toast.error(
        "PDFアップロードに失敗しました。F12コンソールを確認してください。",
      );
    } finally {
      set((s: AppState) => {
        s.pdfUpload.isProcessing = false;
      });
    }
  },

  runPdfUploadJob: () => get().uploadPdfFiles(),
});

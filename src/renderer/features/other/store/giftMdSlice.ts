// src/renderer/features/other/store/giftMdSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { executeScriptJob } from "@renderer/features/operation/services/scriptJobService";
import { systemCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import { getFileName, hasExtension } from "@shared/utils/fileUtils";

export interface GiftMdFile {
  name: string;
  path: string;
}

export interface GiftMdState {
  selectedFile: GiftMdFile | null;
  isProcessing: boolean;
}

export interface GiftMdSlice {
  giftMd: GiftMdState;
  setGiftMdFileFromRaw(rawFiles: File[]): void;
  resetGiftMd(): void;
  executeGiftMdTransfer(): Promise<string>;
}

export const createGiftMdSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  GiftMdSlice
> = (set, get) => ({
  giftMd: {
    selectedFile: null,
    isProcessing: false,
  },

  setGiftMdFileFromRaw: (rawFiles) => {
    if (rawFiles.length === 0) return;

    const file = rawFiles[0];

    const path =
      systemCommands.getFilePath(file) ||
      ("path" in file && typeof file.path === "string" ? file.path : file.name);

    if (!path) return;

    const isSupported =
      hasExtension(path, "txt") ||
      hasExtension(path, "dat") ||
      file.type === "text/plain";

    if (!isSupported) {
      toast.error("テキストファイル(.txt, .DAT)のみ対応しています");
      return;
    }

    set((state) => {
      state.giftMd.selectedFile = {
        name: file.name || getFileName(path) || path,
        path,
      };
    });
  },

  resetGiftMd: () => {
    set((state) => {
      state.giftMd.selectedFile = null;
      state.giftMd.isProcessing = false;
    });
  },

  executeGiftMdTransfer: async () => {
    const { selectedFile, isProcessing } = get().giftMd;

    if (!selectedFile || isProcessing) {
      throw new Error("ファイルを選択してください");
    }

    set((state) => {
      state.giftMd.isProcessing = true;
    });

    try {
      const res = await executeScriptJob(get(), "E41", "E41", [
        selectedFile.path,
      ]);

      toast.success("正常に転送されました");

      return res.message;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      toast.error(`ギフトMD転送エラー: ${message}`);

      throw error;
    } finally {
      set((state) => {
        state.giftMd.isProcessing = false;
      });
    }
  },
});

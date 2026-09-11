// src/renderer/features/other/store/giftMdSlice.ts
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { commands } from "@renderer/services/commands";
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
      commands.getFilePath(file) ||
      ("path" in file && typeof file.path === "string" ? file.path : file.name);

    if (!path) return;

    const isSupported =
      hasExtension(path, "txt") ||
      hasExtension(path, "dat") ||
      file.type === "text/plain";

    if (!isSupported) {
      toast.error("対応していないファイル形式です (.txt, .DAT)");
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
      throw new Error("ファイルが選択されていないか、処理中です。");
    }

    set((state) => {
      state.giftMd.isProcessing = true;
    });

    try {
      const res = await get().runScriptJob("E41", [selectedFile.path]);
      toast.success("ギフトデータMD転送が完了しました");
      return res.message;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`ギフトデータMD転送失敗: ${message}`);
      throw error;
    } finally {
      set((state) => {
        state.giftMd.isProcessing = false;
      });
    }
  },
});

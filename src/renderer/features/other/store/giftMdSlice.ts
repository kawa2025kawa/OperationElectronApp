//src\renderer\features\other\store\giftMdSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { getFileName } from "@shared/utils/fileUtils";

export interface GiftMdFile {
  name: string;
  path: string;
}

export interface GiftMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

export interface GiftMdState {
  selectedFile: GiftMdFile | null;
  isProcessing: boolean;
  infoMessage: GiftMessage;
}

export interface GiftMdSlice {
  giftMd: GiftMdState;
  setGiftMdFileFromRaw(rawFiles: File[]): void;
  resetGiftMd(): void;
  setGiftMdProcessing(isProcessing: boolean): void;
  setGiftMdMessage(message: GiftMessage): void;
}

const DEFAULT_INFO_MESSAGE: GiftMessage = {
  text: "処理対象のギフトデータファイル (.txt, .DAT) をドラッグ＆ドロップしてください。",
  type: "info",
};

export const createGiftMdSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  GiftMdSlice
> = (set) => ({
  giftMd: {
    selectedFile: null,
    isProcessing: false,
    infoMessage: DEFAULT_INFO_MESSAGE,
  },

  setGiftMdFileFromRaw: (rawFiles) => {
    if (rawFiles.length === 0) return;
    const file = rawFiles[0];
    const path =
      window.electronAPI.getFilePath(file) ||
      ("path" in file && typeof file.path === "string" ? file.path : file.name);
    if (!path) return;

    const fileName = file.name || getFileName(path) || path;

    set((state) => {
      state.giftMd.selectedFile = {
        name: fileName,
        path,
      };
      state.giftMd.infoMessage = {
        text: `選択中のファイル: ${fileName}`,
        type: "info",
      };
    });
  },

  resetGiftMd: () => {
    set((state) => {
      state.giftMd.selectedFile = null;
      state.giftMd.isProcessing = false;
      state.giftMd.infoMessage = DEFAULT_INFO_MESSAGE;
    });
  },

  setGiftMdProcessing: (isProcessing) => {
    set((state) => {
      state.giftMd.isProcessing = isProcessing;
    });
  },

  setGiftMdMessage: (message) => {
    set((state) => {
      state.giftMd.infoMessage = message;
    });
  },
});

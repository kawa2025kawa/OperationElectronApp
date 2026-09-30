//src\renderer\services\commands\systemCommands.ts

import type { ScriptFilePath } from "./operationCommands";

export type AppTheme = "dark" | "light";

export const systemCommands = {
  tempomaticUploadDocument(filePaths: string[], expireDate: string) {
    return window.electronAPI.invoke("tempomatic:uploadDocument", {
      filePaths,
      expireDate,
    });
  },

  getFilePath(file: File) {
    return window.electronAPI.getFilePath(file);
  },

  openExternal(urlOrPath: string) {
    return window.electronAPI.invoke("openExternal", { urlOrPath });
  },

  readUpdateInfo() {
    return window.electronAPI.invoke("readUpdateInfo");
  },

  showMainWindow() {
    return window.electronAPI.invoke("showMainWindow");
  },

  showOpenDialog(options: unknown) {
    return window.electronAPI.invoke("showOpenDialog", options);
  },

  processGiftMd(filePath?: ScriptFilePath) {
    return window.electronAPI.invoke("gift-md:process", filePath);
  },

  onThemeChanged(callback: (theme: AppTheme) => void) {
    return window.electronAPI.on("theme-changed", (value: unknown) => {
      if (value === "dark" || value === "light") {
        callback(value);
      }
    });
  },
} as const;

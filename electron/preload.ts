// electron/preload.ts

import { contextBridge, ipcRenderer, webUtils } from "electron";

type IpcListener = (...args: unknown[]) => void;

const electronAPI = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return ipcRenderer.invoke(channel, ...args) as Promise<T>;
  },

  on: (channel: string, callback: IpcListener): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => {
      callback(...args);
    };
    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },

  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch (error) {
      console.error("[Preload] getFilePath failed:", error);
      return "";
    }
  },
} as const;

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

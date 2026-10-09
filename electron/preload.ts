// electron/preload.ts

import { contextBridge, ipcRenderer, webUtils } from "electron";
import { exposeElectronTRPC } from "electron-trpc/main";
import type { IpcChannelMap } from "@shared/types/electron/ipc";

// electron-trpc のブリッジを露出
process.once("loaded", () => {
  exposeElectronTRPC();
});

type IpcListener = (...args: unknown[]) => void;

const electronAPI = {
  invoke: <K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]["args"]
  ): Promise<IpcChannelMap[K]["return"]> => {
    return ipcRenderer.invoke(String(channel), ...args) as Promise<
      IpcChannelMap[K]["return"]
    >;
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

// electron/preload.ts

import { contextBridge, ipcRenderer, webUtils } from "electron";
import type {
  IpcChannelMap,
  IpcEventMap,
} from "@shared/types/electron/ipcTypes";

type IpcEventListener<K extends keyof IpcEventMap> = (
  ...args: IpcEventMap[K]
) => void;

function invoke<K extends keyof IpcChannelMap>(
  channel: K,
  ...args: IpcChannelMap[K]["args"]
): Promise<IpcChannelMap[K]["return"]> {
  return ipcRenderer.invoke(channel, ...args) as Promise<
    IpcChannelMap[K]["return"]
  >;
}

function on<K extends keyof IpcEventMap>(
  channel: K,
  callback: IpcEventListener<K>,
): () => void {
  const listener = (
    _event: Electron.IpcRendererEvent,
    ...args: unknown[]
  ): void => {
    callback(...(args as unknown as IpcEventMap[K]));
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

function getFilePath(file: File): string {
  try {
    return webUtils.getPathForFile(file);
  } catch (error) {
    console.error("[Preload] getFilePath failed:", error);
    return "";
  }
}

const electronAPI = {
  invoke,
  on,
  getFilePath,
} as const;

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

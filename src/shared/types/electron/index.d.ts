// src/shared/types/electron/index.d.ts

import type { IpcChannelMap, IpcEventMap } from "./ipcTypes";

export interface IElectronAPI {
  invoke<K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]["args"]
  ): Promise<IpcChannelMap[K]["return"]>;

  on<K extends keyof IpcEventMap>(
    channel: K,
    callback: (...args: IpcEventMap[K]) => void,
  ): () => void;

  getFilePath(file: File): string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

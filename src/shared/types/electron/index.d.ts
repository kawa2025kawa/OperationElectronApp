// src/shared/types/electron.d.ts

import type { IpcChannelMap } from "./ipc";

export interface IElectronAPI {
  invoke<K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]["args"]
  ): Promise<IpcChannelMap[K]["return"]>;

  on(channel: string, callback: (...args: unknown[]) => void): () => void;
  getFilePath(file: File): string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

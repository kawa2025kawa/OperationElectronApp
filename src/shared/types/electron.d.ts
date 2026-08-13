// src/shared/types/electron.d.ts

export interface IElectronAPI {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
  getFilePath(file: File): string;
  openExternal(url: string): Promise<void>;
  showWindow(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

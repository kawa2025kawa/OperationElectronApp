// src/shared/types/electron.d.ts

export interface IElectronAPI {
  /**
   * Electron IPC invoke
   */
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;

  /**
   * Electron IPC event subscribe
   *
   * return:
   * unsubscribe function
   */
  on(channel: string, callback: (...args: unknown[]) => void): () => void;

  /**
   * File absolute path
   */
  getFilePath(file: File): string;

  /**
   * Open external url
   */
  openExternal(url: string): Promise<void>;

  /**
   * Show main window
   */
  showWindow(): Promise<void>;

  /**
   * Open dialog
   */
  showOpenDialog(options: unknown): Promise<string[] | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

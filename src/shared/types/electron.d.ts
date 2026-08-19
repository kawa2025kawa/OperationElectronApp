// src/shared/types/electron.d.ts

export interface IElectronAPI {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;

  on(channel: string, callback: (...args: unknown[]) => void): () => void;

  getFilePath(file: File): string;

  openExternal(url: string): Promise<void>;

  showWindow(): Promise<void>;

  showOpenDialog(options: unknown): Promise<unknown>;

  /**
   * Main プロセス (IPC) 経由で Gmail のプライマリ署名を取得する
   */
  getGmailSignature(accessToken?: string): Promise<string>;

  /**
   * Main プロセス (IPC) 経由で Gmail の下書きを作成する
   */
  createGmailDraft(params: { accessToken: string; raw: string }): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

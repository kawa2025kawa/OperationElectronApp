export interface IElectronAPI {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
  getFilePath(file: File): string;
  openExternal(url: string): Promise<void>;
  showWindow(): Promise<void>;
  showOpenDialog(options: unknown): Promise<unknown>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

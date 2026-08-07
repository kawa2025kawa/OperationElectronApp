import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  /**
   * Chromiumのセキュリティ制限を回避し、Fileオブジェクトから絶対パスを取得
   */
  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return "";
    }
  },

  openExternal: async (url: string): Promise<void> => {
    await ipcRenderer.invoke("openExternal", {
      urlOrPath: url,
    });
  },

  showWindow: () => ipcRenderer.invoke("showMainWindow"),

  showOpenDialog: (options: unknown) =>
    ipcRenderer.invoke("showOpenDialog", options),
});

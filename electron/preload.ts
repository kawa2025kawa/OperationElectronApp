import { contextBridge, ipcRenderer, webUtils } from "electron";

type IpcListener = (...args: unknown[]) => void;

interface GmailDraftParams {
  accessToken: string;
  raw: string;
}

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

  openExternal: async (url: string): Promise<void> => {
    await ipcRenderer.invoke("openExternal", {
      urlOrPath: url,
    });
  },

  showWindow: async (): Promise<void> => {
    await ipcRenderer.invoke("showMainWindow");
  },

  showOpenDialog: (options: unknown): Promise<unknown> => {
    return ipcRenderer.invoke("showOpenDialog", options);
  },

  getGmailSignature: (accessToken?: string): Promise<string> => {
    return ipcRenderer.invoke("gmail:getSignature", accessToken);
  },

  createGmailDraft: (params: GmailDraftParams): Promise<void> => {
    return ipcRenderer.invoke("gmail:createDraft", params);
  },
} as const;

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

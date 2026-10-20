// electron/preload.ts

import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

type IpcListener = (...args: unknown[]) => void;

const electronAPI = {
  // 型定義に基づいてメインプロセスへIPC通信を行い、処理結果を返す
  invoke: <K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]["args"]
  ): Promise<IpcChannelMap[K]["return"]> => {
    return ipcRenderer.invoke(String(channel), ...args) as Promise<
      IpcChannelMap[K]["return"]
    >;
  },

  // メインプロセスからのIPCイベントを受信し、解除用の関数を返す
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

  // Fileオブジェクトから実際のファイルパスを取得し、失敗時は空文字列を返す
  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch (error) {
      console.error("[Preload] getFilePath failed:", error);
      return "";
    }
  },
} as const;

// レンダラープロセスにelectronAPIを公開し、安全にElectronの機能を利用できるようにする
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// src/renderer/services/systemIpcService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { UpdateInfo } from "@shared/types/system";

/**
 * システム操作（外部起動・マニュアル・更新確認等）の IPC 通信を集約するサービス
 */
export const systemIpcService = {
  /** アプリのバージョン番号を取得する */
  getAppVersion: (): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.GET_APP_VERSION),

  /** メインウィンドウを表示・フォーカスする */
  showMainWindow: (): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW),

  /** アプリケーションを終了する */
  quitApp: (): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.QUIT_APP),

  /** 指定された管理Noのマニュアルサイトを開く */
  openManual: (target: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_MANUAL, { target }),

  /** 外部URLまたはローカルパスを既定のアプリケーションで開く */
  openExternal: (urlOrPath: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, { urlOrPath }),

  /** ファイル/フォルダ選択ダイアログを表示する */
  showOpenDialog: (
    options?: Record<string, unknown>,
  ): Promise<string[] | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG, options),

  /** アプリの最新アップデート情報を読み込む */
  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO),
};

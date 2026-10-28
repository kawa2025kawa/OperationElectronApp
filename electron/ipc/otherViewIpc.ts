// electron/ipc/otherViewIpc.ts

import { ipcMain } from "electron";
import fs from "fs-extra";
import path from "node:path";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// ギフトMDファイルを処理するIPCハンドラーを登録する。
export function registerOtherIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.OTHER.PROCESS_GIFT_MD,
    async (
      _event,
      filePath: IpcChannelMap[typeof IPC_CHANNELS.OTHER.PROCESS_GIFT_MD]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.OTHER.PROCESS_GIFT_MD]["return"]
    > => {
      if (!filePath) {
        throw new Error("ファイルパスが指定されていません");
      }

      const ext = path.extname(filePath).toLowerCase();

      if (ext !== ".txt" && ext !== ".dat") {
        throw new Error(
          "サポートされていない形式です (.txt, .DAT ファイルを選択してください)",
        );
      }

      if (!(await fs.pathExists(filePath))) {
        throw new Error(`ファイルが見つかりません: ${path.basename(filePath)}`);
      }

      return runJobE41(filePath);
    },
  );
}

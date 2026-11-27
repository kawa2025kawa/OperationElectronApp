// electron/features/operation/jobs/scripts/eseries/job_e1.ts

import path from "node:path";
import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import {
  checkFileUpdatedToday,
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  host: NETWORK_HOSTS.MDSYUHAI01,
  subPaths: ["IF", "EOB棚割", "SND"] as const,
  keyword: "EOB_DSP_001",
} as const;

/**
 * 当日分の EOB棚割ファイルを受信しているか確認する。
 */
export async function runJobE1(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const targetDir = getNetworkHostPath(CONFIG.host, ...CONFIG.subPaths);
    const isReceivedToday = await checkReceivedToday(targetDir);

    logger.section("対象フォルダ");
    logger.log(targetDir);

    if (!isReceivedToday) {
      logger.section("未検出ファイル");
      logger.log(CONFIG.keyword);
      return logger.needsAction();
    }

    logger.section("検出ファイル");
    logger.log(CONFIG.keyword);
    return logger.complete();
  });
}

async function checkReceivedToday(targetDir: string): Promise<boolean> {
  const now = new Date();
  const fileNames = await withNetworkAuthRetry(targetDir, () =>
    listFilesInDir(targetDir),
  );

  for (const fileName of fileNames) {
    if (!fileName.includes(CONFIG.keyword)) continue;

    const status = await checkFileUpdatedToday(
      path.join(targetDir, fileName),
      now,
    );
    if (status.isToday) return true;
  }

  return false;
}
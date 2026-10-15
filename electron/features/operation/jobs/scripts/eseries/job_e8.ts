import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { collectAndZipTodayAcosFiles } from "./acosSendHelper";

const TARGET_FILES = new Set([
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
]);

export async function runJobE8(): Promise<string> {
  const logger = new JobLogger();

  try {
    logger.log("ACOS送信ファイル確認・ZIP作成処理を開始します");
    logger.log(`対象ファイル数 : ${TARGET_FILES.size}件`);

    const message = await collectAndZipTodayAcosFiles(
      {
        zipPrefix: "SendData",
        fileMatcher: (files) =>
          files.filter((fileName) => TARGET_FILES.has(fileName)),
        expectedCount: TARGET_FILES.size,
      },
      logger,
    );

    return logger.complete(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}

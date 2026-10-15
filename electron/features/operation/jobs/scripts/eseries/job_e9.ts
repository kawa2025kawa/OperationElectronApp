// electron/features/operation/jobs/scripts/eseries/job_e9.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { collectAndZipTodayAcosFiles } from "./acosSendHelper";

const EXPECTED_FILE_COUNT = 16;

export async function runJobE9(): Promise<string> {
  const logger = new JobLogger();

  logger.log("ACOS POP送信ファイル確認・ZIP作成処理を開始します");
  logger.log(`期待ファイル数 : ${EXPECTED_FILE_COUNT}件`);
  logger.log("検索条件 : FPOPHAT*.TXT（大文字・小文字を区別しない）");

  try {
    const message = await collectAndZipTodayAcosFiles(
      {
        zipPrefix: "SendData_POP",
        fileMatcher: (files) =>
          files.filter((fileName) => {
            const upper = fileName.toUpperCase();

            return upper.startsWith("FPOPHAT") && upper.endsWith(".TXT");
          }),
        expectedCount: EXPECTED_FILE_COUNT,
        includeFileList: true,
      },
      logger,
    );

    return logger.complete(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}

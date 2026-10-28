// electron/features/operation/jobs/scripts/eseries/job_e55.ts
// e5 仕入原価リストデータ作成完了後のチェック処理
// 3.宮地店を対象

import fs from "fs-extra";
import iconv from "iconv-lite";
import { isSameDay } from "date-fns";
import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const SOURCE_PATH = "\\\\192.12.2.1\\d$\\BELC\\ftp\\PC0140.dat";
const TARGET_PATH = "\\\\C0088150\\nec\\ftp\\TENF0140.dat";
const ENCODING = "Windows-31J";
const TARGET_LINE_PREFIX = "01,012,";

async function isUpdatedToday(filePath: string): Promise<boolean> {
  return (
    (await fs.pathExists(filePath)) &&
    isSameDay((await fs.stat(filePath)).mtime, new Date())
  );
}

async function readLines(filePath: string): Promise<string[]> {
  return iconv
    .decode(await fs.readFile(filePath), ENCODING)
    .split(/\r?\n/)
    .filter((line) => line.trim());
}

export async function runJobE55(): Promise<JobResult> {
  const logger = new JobLogger();

  try {
    for (const filePath of [SOURCE_PATH, TARGET_PATH]) {
      if (!(await isUpdatedToday(filePath))) {
        return {
          message: logger.needsAction(
            `ファイルが存在しないか、更新日が本日ではありません: ${filePath}`,
          ),
        };
      }
    }

    const sourceLines = await readLines(SOURCE_PATH);
    const targetLines = await readLines(TARGET_PATH);
    const targetLine = sourceLines.find((line) =>
      line.startsWith(TARGET_LINE_PREFIX),
    );

    if (!targetLine) {
      return {
        message: logger.needsAction(
          "PC0140.datに部門01・店番号012のデータがありません。",
        ),
      };
    }

    const [dept, store, purchase, transfer, sales, startDate, endDate] =
      targetLine.split(",");

    logger.log(`店番号: ${store}`);
    logger.log(`部門: ${dept}`);
    logger.log(`仕入原価(税抜): ${purchase}`);
    logger.log(`振替原価(税抜): ${transfer}`);
    logger.log(`売上計(税抜): ${sales}`);
    logger.log(`開始日: ${startDate}`);
    logger.log(`終了日: ${endDate}`);

    if (!targetLines.includes(targetLine)) {
      return {
        message: logger.needsAction(
          "PC0140.datとTENF0140.datの対象行が一致しません。",
        ),
      };
    }

    return {
      message: logger.complete(),
    };
  } catch (error: unknown) {
    throw logger.fail(error instanceof Error ? error.message : String(error));
  }
}

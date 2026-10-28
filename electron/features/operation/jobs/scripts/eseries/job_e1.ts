// electron/features/operation/jobs/scripts/eseries/job_e1.ts

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\mdsyuhai01.BELC01.belc.local\\IF\\EOB棚割\\SND",
  keywords: ["EOB_DSP_001"],
} as const;

function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

async function findTodayFile(
  entries: import("node:fs").Dirent[],
  keyword: string,
): Promise<string | undefined> {
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.includes(keyword)) continue;

    const { mtime } = await stat(path.join(CONFIG.targetDir, entry.name));

    if (format(mtime, "yyyy-MM-dd") === getToday()) {
      return entry.name;
    }
  }

  return undefined;
}

export async function runJobE1(): Promise<string> {
  const logger = new JobLogger();
  const today = getToday();

  try {
    logger.log(`対象ディレクトリ : ${CONFIG.targetDir}`);
    logger.log(`検索日付 : ${today}`);

    const entries = await readdir(CONFIG.targetDir, {
      withFileTypes: true,
    });
    const missingKeywords: string[] = [];

    for (const keyword of CONFIG.keywords) {
      const matchedFile = await findTodayFile(entries, keyword);

      if (!matchedFile) {
        missingKeywords.push(keyword);
        logger.log(`NG 対象なし（本日更新されたファイルなし） [${keyword}]`);
        continue;
      }

      logger.log(`OK 検出 [${keyword}] : ${matchedFile}`);
    }

    if (missingKeywords.length > 0) {
      return logger.needsAction(
        `未受信ファイルあり (対象: ${missingKeywords.join(", ")})`,
      );
    }

    return logger.complete("全ファイル受信確認");
  } catch (error: unknown) {
    throw logger.fail(error instanceof Error ? error.message : String(error));
  }
}

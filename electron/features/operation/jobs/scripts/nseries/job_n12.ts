import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const TARGET_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";

const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export async function runJobN12(): Promise<string> {
  const logger = new JobLogger();
  const today = format(new Date(), "yyyyMMdd");

  try {
    logger.log(`処理日 : ${today}`);
    logger.log(`監視ディレクトリ : ${TARGET_DIR}`);

    if (!(await fs.pathExists(TARGET_DIR))) {
      throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
    }

    const files = await fs.readdir(TARGET_DIR);
    const missing: string[] = [];

    for (const keyword of KEYWORDS) {
      const matchedFiles = files.filter((fileName) =>
        fileName.includes(keyword),
      );

      if (matchedFiles.length === 0) {
        missing.push(keyword);
        logger.log(`[${keyword}] 未検出`);
        continue;
      }

      const fileWithStats = await Promise.all(
        matchedFiles.map(async (fileName) => {
          const filePath = path.join(TARGET_DIR, fileName);
          const stat = await fs.stat(filePath);

          return {
            fileName,
            mtime: stat.mtime,
            isFile: stat.isFile(),
          };
        }),
      );

      const latest = fileWithStats
        .filter((file) => file.isFile)
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];

      if (!latest) {
        missing.push(keyword);
        logger.log(`[${keyword}] ファイル情報取得失敗`);
        continue;
      }

      logger.log(`[${keyword}] 最新ファイル : ${latest.fileName}`);
      logger.log(`更新日時 : ${format(latest.mtime, "yyyy/MM/dd HH:mm:ss")}`);
    }

    if (missing.length > 0) {
      throw new Error(`未受信ファイルあり (対象: ${missing.join(", ")})`);
    }

    return logger.complete("全ファイル確認完了");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}

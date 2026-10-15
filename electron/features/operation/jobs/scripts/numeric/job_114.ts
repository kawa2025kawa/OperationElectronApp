// electron/features/operation/jobs/scripts/numeric/job_114.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  logDir: "\\\\192.88.100.1\\diskD\\execute\\log",
  fileSuffix: "ORJH0010.log",
  keyword: "READ=",
  encoding: "Shift_JIS",
} as const;

async function findLogFile(): Promise<string | undefined> {
  const datePrefix = format(new Date(), "yyMMdd");
  const files = await fs.readdir(CONFIG.logDir);

  return files.find(
    (name) => name.startsWith(datePrefix) && name.includes(CONFIG.fileSuffix),
  );
}

async function readCount(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const text = iconv.decode(buffer, CONFIG.encoding);
  const match = text.match(/READ=([^\s\r\n,]+)/);

  if (!match?.[1]) {
    throw new Error(`キーワード '${CONFIG.keyword}' がログ内に見つかりません`);
  }

  const rawCount = match[1];
  const count = Number.parseInt(rawCount, 10);

  return Number.isNaN(count) ? `${rawCount}件` : `${count.toLocaleString()}件`;
}

export async function runJob114(): Promise<string> {
  const now = new Date();
  const logger = new JobLogger();

  logger.log(`ファイルパス : ${CONFIG.logDir}`);

  if (!(await fs.pathExists(CONFIG.logDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.logDir}`);
  }

  const targetFile = await findLogFile();

  if (!targetFile) {
    logger.log(
      `対象ファイルなし (${format(now, "yyMMdd")}*_${CONFIG.fileSuffix})`,
    );
    throw logger.fail(
      `ログファイルが見つかりません (${format(now, "yyMMdd")})`,
    );
  }

  const filePath = path.join(CONFIG.logDir, targetFile);
  const stat = await fs.stat(filePath);

  logger.log(`検出ファイル : ${targetFile}`);
  logger.log(
    `ファイル更新日時 : ${format(stat.mtime, "yyyy/MM/dd HH:mm:ss")}\n`,
  );

  try {
    const countText = await readCount(filePath);
    logger.log(`READ件数 : ${countText}`);
    return logger.complete(countText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.log(`必須キーワード "${CONFIG.keyword}" なし`);
    throw logger.fail(message);
  }
}

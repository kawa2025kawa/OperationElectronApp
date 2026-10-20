// electron/features/operation/jobs/scripts/eseries/job_e1.ts

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\mdsyuhai01.BELC01.belc.local\\IF\\EOB棚割\\SND",
  keywords: ["EOB_DSP_001"],
} as const;

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

export async function runJobE1(): Promise<string> {
  const logger = new JobLogger();

  // 本日の日付（ローカルタイム）
  const now = new Date();
  const today =
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`;

  logger.log(`対象ディレクトリ : ${CONFIG.targetDir}`);
  logger.log(`検索日付 : ${today}`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  // ディレクトリ直下のファイル一覧を取得
  const entries = await readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const missingKeywords: string[] = [];

  for (const keyword of CONFIG.keywords) {
    let matchedFile: string | undefined;

    for (const entry of entries) {
      // フォルダは対象外
      if (!entry.isFile()) continue;

      // ファイル名にキーワードを含むものだけを対象にする
      if (!entry.name.includes(keyword)) continue;

      const filePath = path.join(CONFIG.targetDir, entry.name);
      const fileStat = await stat(filePath);

      // 更新日時が本日か確認（ローカルタイム）
      const modified = fileStat.mtime;
      const modifiedDate =
        `${modified.getFullYear()}-` +
        `${String(modified.getMonth() + 1).padStart(2, "0")}-` +
        `${String(modified.getDate()).padStart(2, "0")}`;

      if (modifiedDate === today) {
        matchedFile = entry.name;
        break;
      }
    }

    if (!matchedFile) {
      missingKeywords.push(keyword);
      logger.log(`NG 対象なし（本日更新されたファイルなし） [${keyword}]`);
      continue;
    }

    logger.log(`OK 検出 [${keyword}] : ${matchedFile}`);
  }

  if (missingKeywords.length > 0) {
    throw logger.fail(
      `未受信ファイルあり (対象: ${missingKeywords.join(", ")})`,
    );
  }

  return logger.complete("全ファイル受信確認");
}

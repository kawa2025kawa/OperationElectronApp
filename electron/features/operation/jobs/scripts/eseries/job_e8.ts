// electron/features/operation/jobs/scripts/job_e8.ts

import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { isSameDay, format } from "date-fns";
import { compressFiles } from "../helpers/shared/zipHelper";

const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";
const TARGET_FILES = [
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
] as const;

async function getTodayTargetFiles(dirPath: string): Promise<string[]> {
  const now = new Date();
  const matchedFiles: string[] = [];

  for (const fileName of TARGET_FILES) {
    const filePath = path.join(dirPath, fileName);
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }
    const stat = await fs.stat(filePath);
    if (!isSameDay(stat.mtime, now)) {
      const fileDateStr = format(stat.mtime, "yyyy/MM/dd");
      const todayStr = format(now, "yyyy/MM/dd");
      throw new Error(
        `日付が今日ではありません: ${fileName} (更新日: ${fileDateStr}, 今日: ${todayStr})`,
      );
    }
    matchedFiles.push(filePath);
  }
  return matchedFiles;
}

export async function runJobE8(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }
  const targetFiles = await getTodayTargetFiles(TARGET_DIR);
  const desktopDir = path.join(os.homedir(), "Desktop");
  const todayStr = format(new Date(), "yyyyMMdd");
  const zipFileName = `SendData_${todayStr}.zip`;
  const outputZipPath = path.join(desktopDir, zipFileName);

  await compressFiles(targetFiles, outputZipPath);
  return `デスクトップに ${zipFileName} を作成しました。`;
}

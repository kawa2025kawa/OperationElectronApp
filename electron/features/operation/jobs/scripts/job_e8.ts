// electron/features/operation/jobs/scripts/job_e8.ts

import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import { isSameDay, format } from "date-fns";

const execAsync = promisify(exec);

const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";

// 🎯 先頭のドットを削除
const TARGET_FILES = [
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
] as const;

/**
 * 本日更新された指定ファイルを取得
 */
async function getTodayTargetFiles(dirPath: string): Promise<string[]> {
  const now = new Date();
  const matchedFiles: string[] = [];

  for (const fileName of TARGET_FILES) {
    const filePath = `${dirPath}\\${fileName}`;

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`対象ファイルが存在しません: ${filePath}`);
    }

    const stat = await fs.stat(filePath);
    if (!isSameDay(stat.mtime, now)) {
      const fileDateStr = format(stat.mtime, "yyyy/MM/dd");
      const todayStr = format(now, "yyyy/MM/dd");
      throw new Error(
        `ファイルが本日更新されていません: ${fileName} (更新日時: ${fileDateStr}, 本日: ${todayStr})`,
      );
    }

    matchedFiles.push(filePath);
  }

  return matchedFiles;
}

/**
 * PowerShell を使用してファイルを ZIP 圧縮
 */
async function compressToZip(
  sourceFilePaths: string[],
  outputZipPath: string,
): Promise<void> {
  if (await fs.pathExists(outputZipPath)) {
    await fs.remove(outputZipPath);
  }

  const fileListStr = sourceFilePaths.map((p) => `'${p}'`).join(",");
  const psCommand = `powershell -Command "Compress-Archive -Path ${fileListStr} -DestinationPath '${outputZipPath}' -Force"`;

  await execAsync(psCommand);
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

  await compressToZip(targetFiles, outputZipPath);

  return `正常終了: デスクトップに ${zipFileName} を作成しました`;
}

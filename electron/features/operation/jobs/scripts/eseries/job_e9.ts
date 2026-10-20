import path from "node:path";
import os from "node:os";
import { readdir, stat } from "node:fs/promises";
import { isSameDay } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { createZipArchive } from "@electron/features/operation/jobs/scripts/helpers/zipHelper";
import { formatDateTime } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";
const EXPECTED_FILE_COUNT = 16;

/**
 * ディレクトリの存在確認
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const dirStat = await stat(dirPath);
    return dirStat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * ディレクトリ直下のファイルパス一覧を取得
 */
async function findFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dirPath, entry.name));
}

/**
 * ファイル情報を取得
 */
async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  mtime: Date;
}> {
  const fileStat = await stat(filePath);

  return {
    fileName: path.basename(filePath),
    mtime: fileStat.mtime,
  };
}

export async function runJobE9(): Promise<string> {
  const logger = new JobLogger();
  const now = new Date();

  try {
    logger.log(`対象ディレクトリ : ${TARGET_DIR}`);
    logger.log(`期待ファイル数 : ${EXPECTED_FILE_COUNT}件`);
    logger.log("検索条件 : FPOPHAT*.TXT（大文字・小文字を区別しない）");

    // ディレクトリ存在確認
    if (!(await directoryExists(TARGET_DIR))) {
      throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
    }

    // ファイル一覧取得
    const allFilePaths = await findFiles(TARGET_DIR);

    // FPOPHAT*.TXT に一致するファイルを抽出
    const matchedFilePaths = allFilePaths.filter((filePath) => {
      const upper = path.basename(filePath).toUpperCase();
      return upper.startsWith("FPOPHAT") && upper.endsWith(".TXT");
    });

    logger.log(`検出ファイル数 : ${matchedFilePaths.length}件`);

    // ファイル件数確認
    if (matchedFilePaths.length !== EXPECTED_FILE_COUNT) {
      throw new Error(
        `ファイル件数不一致 (期待値: ${EXPECTED_FILE_COUNT}, 実際: ${matchedFilePaths.length})`,
      );
    }

    // 更新日時が本日かどうかを検証
    for (const filePath of matchedFilePaths) {
      const fileInfo = await getFileInfo(filePath);

      logger.log(`ファイル名 : ${fileInfo.fileName}`);
      logger.log(`更新日時 : ${formatDateTime(fileInfo.mtime)}`);

      if (!isSameDay(fileInfo.mtime, now)) {
        throw new Error(
          `更新日が本日ではありません: ${fileInfo.fileName} ` +
            `(${formatDateTime(fileInfo.mtime, "yyyy/MM/dd")})`,
        );
      }
    }

    logger.log("更新日検証結果 : 正常");

    // デスクトップにZIPを作成
    const outputDir = path.join(os.homedir(), "Desktop");

    const message = await createZipArchive(
      {
        filePaths: matchedFilePaths,
        outputDir,
        zipPrefix: "SendData_POP",
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

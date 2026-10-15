// electron/features/operation/jobs/scripts/eseries/acosSendHelper.ts

import path from "node:path";
import os from "node:os";
import { isSameDay } from "date-fns";

import { compressFiles, findFiles, getFileInfo } from "../helpers/fileUtils";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";
import {
  formatDateTime,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";

export interface CollectAndZipOptions {
  zipPrefix: string;
  fileMatcher: (allFiles: string[]) => string[];
  expectedCount?: number;
  includeFileList?: boolean;
}

export async function collectAndZipTodayAcosFiles(
  options: CollectAndZipOptions,
  logger: JobLogger,
): Promise<string> {
  const now = new Date();

  logger.log(`対象ディレクトリ : ${TARGET_DIR}`);
  logger.log(`ZIPファイル接頭辞 : ${options.zipPrefix}`);

  if (!(await directoryExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const allFilePaths = await findFiles(TARGET_DIR);
  const allFileNames = allFilePaths.map((filePath) => path.basename(filePath));

  logger.log(`検索対象ファイル数 : ${allFileNames.length}件`);

  const matchedNames = options.fileMatcher(allFileNames);

  logger.log(`検出ファイル数 : ${matchedNames.length}件`);

  if (
    options.expectedCount !== undefined &&
    matchedNames.length !== options.expectedCount
  ) {
    throw new Error(
      `ファイル件数不一致 (期待値: ${options.expectedCount}, 実際: ${matchedNames.length})`,
    );
  }

  if (matchedNames.length === 0) {
    throw new Error("圧縮対象ファイルが見つかりません。");
  }

  const filePaths: string[] = [];

  for (const fileName of matchedNames) {
    const filePath = path.join(TARGET_DIR, fileName);
    const fileInfo = await getFileInfo(filePath);

    logger.log(`ファイル名 : ${fileInfo.fileName}`);
    logger.log(`更新日時 : ${formatDateTime(fileInfo.mtime)}`);

    if (!isSameDay(fileInfo.mtime, now)) {
      throw new Error(
        `更新日が本日ではありません: ${fileName} (${formatDateTime(fileInfo.mtime, "yyyy/MM/dd")})`,
      );
    }

    filePaths.push(filePath);
  }

  logger.log("更新日検証結果 : 正常");

  const desktopDir = path.join(os.homedir(), "Desktop");
  const todayStr = getDateKey(now);
  const zipFileName = `${options.zipPrefix}_${todayStr}.zip`;
  const outputZipPath = path.join(desktopDir, zipFileName);

  logger.log(`ZIP出力先 : ${outputZipPath}`);
  logger.log("ZIPファイルを作成しています");

  await compressFiles(filePaths, outputZipPath);

  logger.log(`ZIP作成完了 : ${zipFileName}`);

  let message = `デスクトップに ${zipFileName} を生成しました (${filePaths.length}件)`;

  if (options.includeFileList) {
    const fileList = matchedNames
      .map((name, index) => `\n ${index + 1}. ${name}`)
      .join("");

    message += `\n\n${fileList}`;

    logger.log("圧縮対象ファイル一覧 :");

    for (let index = 0; index < matchedNames.length; index++) {
      logger.log(`  ${index + 1}. ${matchedNames[index]}`);
    }
  }

  return message;
}

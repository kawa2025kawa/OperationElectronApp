// electron/features/operation/jobs/scripts/helpers/zipHelper.ts

import path from "node:path";
import fs from "fs-extra";
import archiver from "archiver";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

export interface CreateZipOptions {
  /** 圧縮対象のファイルパス一覧 */
  filePaths: string[];

  /** ZIPを出力するディレクトリパス */
  outputDir: string;

  /** ZIPファイル名の接頭辞 (例: "ORDER_DATA") */
  zipPrefix: string;

  /** 戻り値およびログにファイル一覧を含めるか (デフォルト: false) */
  includeFileList?: boolean;
}

interface ZipSourceFile {
  filePath: string;
  fileName: string;
  mtime: Date;
}

/**
 * ディレクトリが存在するか確認する
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * ZIP圧縮を実行する。
 *
 * - ZIP内のファイル名は元ファイルの basename を使用する
 * - ZIP内の更新日時は元ファイルの mtime を使用する
 * - 圧縮対象は通常ファイルに限定する
 * - 指定された圧縮対象に問題があればエラーにする
 */
async function compressFiles(
  files: ZipSourceFile[],
  outputZipPath: string,
): Promise<void> {
  if (files.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

  // 出力ZIPが圧縮対象自身と同じパスの場合、入力ファイルを破壊するため拒否する。
  const resolvedOutputPath = path.resolve(outputZipPath);

  for (const file of files) {
    const resolvedInputPath = path.resolve(file.filePath);

    const isSamePath =
      process.platform === "win32"
        ? resolvedInputPath.toLowerCase() === resolvedOutputPath.toLowerCase()
        : resolvedInputPath === resolvedOutputPath;

    if (isSamePath) {
      throw new Error(
        `出力ZIPと圧縮対象ファイルのパスが重複しています: ${file.filePath}`,
      );
    }
  }

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    let settled = false;

    const fail = (error: Error): void => {
      if (settled) {
        return;
      }

      settled = true;
      archive.destroy();
      output.destroy();
      reject(error);
    };

    output.on("close", () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    });

    output.on("error", fail);
    archive.on("error", fail);

    // 指定したファイルを完全に圧縮できない場合は失敗として扱う。
    archive.on("warning", fail);

    archive.pipe(output);

    try {
      for (const file of files) {
        archive.file(file.filePath, {
          name: file.fileName,
          date: file.mtime,
        });
      }

      void (async () => {
        try {
          await archive.finalize();
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * 指定されたファイル群を、日付入りのZIPアーカイブとして作成する。
 *
 * @returns 作成したZIPファイル名と対象件数を含むメッセージ
 */
export async function createZipArchive(
  options: CreateZipOptions,
  logger: JobLogger,
): Promise<string> {
  const { filePaths, outputDir, zipPrefix, includeFileList = false } = options;

  logger.log(`出力先ディレクトリ : ${outputDir}`);
  logger.log(`ZIPファイル接頭辞 : ${zipPrefix}`);
  logger.log(`対象ファイル数 : ${filePaths.length}件`);

  if (filePaths.length === 0) {
    throw new Error("圧縮対象のファイルが指定されていません。");
  }

  if (!(await directoryExists(outputDir))) {
    throw new Error(`出力先ディレクトリが存在しません: ${outputDir}`);
  }

  const files: ZipSourceFile[] = [];

  // 圧縮対象の検証とログ出力をまとめて行う。
  for (const filePath of filePaths) {
    const stat = await fs.stat(filePath);

    if (!stat.isFile()) {
      throw new Error(`圧縮対象がファイルではありません: ${filePath}`);
    }

    const fileName = path.basename(filePath);

    files.push({
      filePath,
      fileName,
      mtime: stat.mtime,
    });

    logger.log(`ファイル名 : ${fileName}`);
  }

  const todayStr = getDateKey();
  const zipFileName = `${zipPrefix}_${todayStr}.zip`;
  const outputZipPath = path.join(outputDir, zipFileName);

  logger.log(`ZIP出力先 : ${outputZipPath}`);
  logger.log("ZIPファイルを作成しています...");

  await compressFiles(files, outputZipPath);

  logger.log(`ZIP作成完了 : ${zipFileName}`);

  let message = `${zipFileName} を作成しました (${filePaths.length}件)`;

  if (includeFileList) {
    const fileList = files
      .map((file, index) => `\n  ${index + 1}. ${file.fileName}`)
      .join("");

    message += `\n\n${fileList}`;

    logger.log("圧縮対象ファイル一覧 :");

    files.forEach((file, index) => {
      logger.log(`  ${index + 1}. ${file.fileName}`);
    });
  }

  return message;
}

// electron/features/operation/jobs/scripts/helpers/zipHelper.ts

import path from "node:path";
import fs from "fs-extra";
import archiver from "archiver";

import {
  directoryExists,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

export interface CreateZipOptions {
  /** 圧縮対象のファイルパス一覧 */
  filePaths: string[];

  /** ZIPを出力するフォルダパス */
  outputDir: string;

  /** ZIPファイル名の接頭辞 (例: "ORDER_DATA") */
  zipPrefix: string;
}

interface ZipSourceFile {
  filePath: string;
  fileName: string;
  mtime: Date;
}

/**
 * ZIP圧縮を実行する。
 */
async function compressFiles(
  files: ZipSourceFile[],
  outputZipPath: string,
): Promise<void> {
  if (files.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

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
      if (settled) return;
      settled = true;
      archive.destroy();
      output.destroy();
      reject(error);
    };

    output.on("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    output.on("error", fail);
    archive.on("error", fail);
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
 * @returns 作成成功時は作成されたZIPファイルのフルパス、失敗時は null
 */
export async function createZipArchive(
  options: CreateZipOptions,
): Promise<string | null> {
  const { filePaths, outputDir, zipPrefix } = options;

  if (filePaths.length === 0) {
    return null;
  }

  try {
    if (!(await directoryExists(outputDir))) {
      return null;
    }

    const files: ZipSourceFile[] = [];

    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath);

      if (!stat.isFile()) {
        return null;
      }

      files.push({
        filePath,
        fileName: path.basename(filePath),
        mtime: stat.mtime,
      });
    }

    const todayStr = getDateKey();
    const zipFileName = `${zipPrefix}_${todayStr}.zip`;
    const outputZipPath = path.join(outputDir, zipFileName);

    await compressFiles(files, outputZipPath);

    return outputZipPath;
  } catch {
    return null;
  }
}

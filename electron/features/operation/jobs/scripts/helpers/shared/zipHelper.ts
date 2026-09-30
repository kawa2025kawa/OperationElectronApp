// electron\features\operation\jobs\scripts\helpers\shared\zipHelper.ts

import * as path from "path";
import fs from "fs-extra";
import archiver from "archiver";

/**
 * 指定したファイルを直接ZIP圧縮する。
 *
 * ZIP内には親フォルダを含めず、
 * 指定したファイルだけを格納する。
 *
 * 例:
 *
 * 202608_ベルクTV売上.zip
 * ├─ 202608ベルクTV単品売上.xlsx
 * └─ 202608ベルクTV部門別売上.xlsx
 */
export async function compressFiles(
  filePaths: string[],
  outputZipPath: string,
): Promise<string> {
  if (filePaths.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    let settled = false;

    const handleError = (error: unknown): void => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    output.on("close", () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });

    output.on("error", handleError);
    archive.on("error", handleError);

    archive.on("warning", (err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") {
        handleError(err);
      }
    });

    archive.pipe(output);

    for (const filePath of filePaths) {
      archive.file(filePath, {
        name: path.basename(filePath),
      });
    }

    void archive.finalize();
  });

  return outputZipPath;
}

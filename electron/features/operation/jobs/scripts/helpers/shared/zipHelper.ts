import path from "node:path";
import fs from "fs-extra";
import archiver from "archiver";

export async function compressFiles(
  filePaths: string[],
  outputZipPath: string,
): Promise<string> {
  if (filePaths.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  const archivePromise = new Promise<void>((resolve, reject) => {
    output.once("close", resolve);
    output.once("error", reject);
    archive.once("error", reject);

    archive.on("warning", (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        reject(error);
      }
    });
  });

  archive.pipe(output);

  for (const filePath of filePaths) {
    const stat = await fs.stat(filePath);

    archive.file(filePath, {
      name: path.basename(filePath),
      date: stat.mtime,
    });
  }

  await archive.finalize();
  await archivePromise;

  return outputZipPath;
}

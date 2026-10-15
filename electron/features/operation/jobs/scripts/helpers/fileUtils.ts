import path from "node:path";
import fs from "fs-extra";
import fg from "fast-glob";
import archiver from "archiver";

// ============================================================
// 型定義
// ============================================================

export interface FindFilesOptions {
  /** ファイル名の先頭一致。複数指定は OR */
  prefix?: string | string[];

  /** ファイル名の末尾一致。複数指定は OR */
  suffix?: string | string[];

  /** ファイル名にすべて含まれる文字列。複数指定は AND */
  includes?: string | string[];

  /** ファイル名にいずれかが含まれる文字列。複数指定は OR */
  anyIncludes?: string | string[];

  /** ファイル名に含まれる日付キー。複数指定は OR */
  dateKey?: string | string[];
}

export interface FileInfo {
  fileName: string;
  filePath: string;
  sizeKb: number;
  mtime: Date;
}

// ============================================================
// 内部関数
// ============================================================

function toStringArray(value?: string | string[]): string[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function matchesAny(
  fileName: string,
  values: string[],
  matcher: (name: string, value: string) => boolean,
): boolean {
  return (
    values.length === 0 || values.some((value) => matcher(fileName, value))
  );
}

function matchesAll(
  fileName: string,
  values: string[],
  matcher: (name: string, value: string) => boolean,
): boolean {
  return values.every((value) => matcher(fileName, value));
}

// ============================================================
// ファイル検索
// ============================================================

/**
 * 指定ディレクトリ直下のファイルを検索する。
 *
 * - サブディレクトリは検索しない
 * - 戻り値はフルパス
 * - 存在しないディレクトリはスキップする
 * - prefix / suffix / anyIncludes / dateKey は OR 条件
 * - includes は AND 条件
 */
export async function findFiles(
  dirs: string | string[],
  options: FindFilesOptions = {},
): Promise<string[]> {
  const directoryList = Array.isArray(dirs) ? dirs : [dirs];

  const prefixes = toStringArray(options.prefix);
  const suffixes = toStringArray(options.suffix);
  const includes = toStringArray(options.includes);
  const anyIncludes = toStringArray(options.anyIncludes);
  const dateKeys = toStringArray(options.dateKey);

  const results: string[] = [];

  for (const dir of directoryList) {
    if (!(await fs.pathExists(dir))) {
      continue;
    }

    const stat = await fs.stat(dir);

    if (!stat.isDirectory()) {
      continue;
    }

    // fast-glob を利用し、直下のファイルだけを検索する。
    const filePaths = await fg("*", {
      cwd: dir,
      absolute: true,
      onlyFiles: true,
      deep: 1,
      dot: true,
    });

    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);

      if (
        !matchesAny(fileName, prefixes, (name, value) => name.startsWith(value))
      ) {
        continue;
      }

      if (
        !matchesAny(fileName, suffixes, (name, value) => name.endsWith(value))
      ) {
        continue;
      }

      if (
        !matchesAll(fileName, includes, (name, value) => name.includes(value))
      ) {
        continue;
      }

      if (
        !matchesAny(fileName, anyIncludes, (name, value) =>
          name.includes(value),
        )
      ) {
        continue;
      }

      if (
        !matchesAny(fileName, dateKeys, (name, value) => name.includes(value))
      ) {
        continue;
      }

      results.push(filePath);
    }
  }

  return results;
}

// ============================================================
// ファイル情報
// ============================================================

/**
 * ファイル情報を取得する。
 */
export async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) {
    throw new Error(`ファイルではありません: ${filePath}`);
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    sizeKb: Math.round((stat.size / 1024) * 100) / 100,
    mtime: stat.mtime,
  };
}

/**
 * 複数ファイルの情報を取得する。
 */
export async function getFilesInfo(filePaths: string[]): Promise<FileInfo[]> {
  return Promise.all(filePaths.map((filePath) => getFileInfo(filePath)));
}

/**
 * 更新日時が最も新しいファイル情報を取得する。
 * 対象が空の場合は undefined を返す。
 */
export async function getLatestFile(
  filePaths: string[],
): Promise<FileInfo | undefined> {
  if (filePaths.length === 0) {
    return undefined;
  }

  const fileInfos = await getFilesInfo(filePaths);

  return fileInfos.reduce((latest, current) =>
    current.mtime.getTime() > latest.mtime.getTime() ? current : latest,
  );
}

// ============================================================
// ファイル移動
// ============================================================

/**
 * ファイルを指定ディレクトリへ移動する。
 * 移動先に同名ファイルが存在する場合は上書きする。
 */
export async function moveFile(
  filePath: string,
  targetDir: string,
): Promise<void>;

/**
 * 複数ファイルを指定ディレクトリへ移動する。
 */
export async function moveFile(
  filePaths: string[],
  targetDir: string,
): Promise<void>;

export async function moveFile(
  source: string | string[],
  targetDir: string,
): Promise<void> {
  const filePaths = Array.isArray(source) ? source : [source];

  await fs.ensureDir(targetDir);

  for (const filePath of filePaths) {
    const stat = await fs.stat(filePath);

    if (!stat.isFile()) {
      throw new Error(`移動対象がファイルではありません: ${filePath}`);
    }

    const targetPath = path.join(targetDir, path.basename(filePath));

    await fs.move(filePath, targetPath, {
      overwrite: true,
    });
  }
}

// ============================================================
// ZIP圧縮
// ============================================================

/**
 * 指定されたファイルを ZIP に圧縮する。
 *
 * - ZIP 内のファイル名は basename
 * - ZIP 内の更新日時は元ファイルの mtime
 * - 出力先ディレクトリは事前に存在している必要がある
 */
export async function compressFiles(
  filePaths: string[],
  outputZipPath: string,
): Promise<void> {
  if (filePaths.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

  await fs.ensureDir(path.dirname(outputZipPath));

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    output.on("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    output.on("error", fail);
    archive.on("error", fail);

    archive.on("warning", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return;
      }
      fail(error);
    });

    archive.pipe(output);

    void (async () => {
      try {
        for (const filePath of filePaths) {
          const stat = await fs.stat(filePath);

          archive.file(filePath, {
            name: path.basename(filePath),
            date: stat.mtime,
          });
        }

        await archive.finalize();
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    })();
  });
}

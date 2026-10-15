import fs from "fs-extra";

/**
 * ファイルまたはディレクトリの存在を確認する。
 */
export async function directoryExists(targetPath: string): Promise<boolean>;

/**
 * 複数のパスの存在を確認する。
 */
export async function directoryExists(
  targetPaths: string[],
): Promise<boolean[]>;

export async function directoryExists(
  target: string | string[],
): Promise<boolean | boolean[]> {
  if (Array.isArray(target)) {
    return Promise.all(target.map((targetPath) => fs.pathExists(targetPath)));
  }

  return fs.pathExists(target);
}

/**
 * ディレクトリを作成する。
 * 既に存在する場合は何もしない。
 */
export async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.ensureDir(directoryPath);
}

/**
 * 時刻に応じて使用するディレクトリを選択する。
 */
export function selectDirectoryByTime(
  date: Date,
  beforeDir: string,
  afterDir: string,
  cutoffHour: number,
  cutoffMinute: number,
): string {
  const cutoff = new Date(date);
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

  return date < cutoff ? beforeDir : afterDir;
}

/**
 * electron/features/operation/jobs/scripts/numeric/job_39.ts
 */

import { format, isSameDay } from "date-fns";
import path from "node:path";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  beforeNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  afterNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  targetFiles: ["Okurikomi_toMD.dat", "htsf0060"] as const,
  maxFilesPerTarget: 2,
} as const;

type FileCheckResult = {
  targetName: string;
  foundNames: string[];
  error?: string;
};

export async function runJob39(): Promise<string> {
  const logger = new JobLogger();
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const today = format(now, "yyyyMMdd");
  const targetDir = isBeforeNoon ? CONFIG.beforeNoonDir : CONFIG.afterNoonDir;

  logger.log(
    `時間帯判定       : ${isBeforeNoon ? "午前 (12時前)" : "午後 (12時以降)"}`,
  );
  logger.log(`対象ディレクトリ : ${targetDir}`);

  try {
    const dirStat = await fs.stat(targetDir);

    if (!dirStat.isDirectory()) {
      throw new Error(`ディレクトリではありません: ${targetDir}`);
    }

    const results: FileCheckResult[] = isBeforeNoon
      ? await Promise.all(
          CONFIG.targetFiles.map(async (targetName) => {
            const filePath = path.join(targetDir, targetName);

            try {
              const stats = await fs.stat(filePath);

              if (!stats.isFile()) {
                return {
                  targetName,
                  foundNames: [],
                  error: "ファイルではありません",
                };
              }

              return {
                targetName,
                foundNames: isSameDay(stats.mtime, now)
                  ? [path.basename(filePath)]
                  : [],
                error: isSameDay(stats.mtime, now)
                  ? undefined
                  : "更新日が本日ではありません",
              };
            } catch (error: unknown) {
              if (
                error instanceof Error &&
                "code" in error &&
                error.code === "ENOENT"
              ) {
                return {
                  targetName,
                  foundNames: [],
                  error: "ファイルが存在しません",
                };
              }

              throw error;
            }
          }),
        )
      : await (async () => {
          const entries = await fs.readdir(targetDir, {
            withFileTypes: true,
          });

          return CONFIG.targetFiles.map((targetName) => {
            const prefix = `${targetName}_${today}`;
            const foundNames = entries
              .filter(
                (entry) => entry.isFile() && entry.name.startsWith(prefix),
              )
              .map((entry) => entry.name);

            return {
              targetName,
              foundNames,
              error:
                foundNames.length === 0
                  ? `${prefix}* (ファイルなし)`
                  : foundNames.length > CONFIG.maxFilesPerTarget
                    ? `対象ファイルが上限超過 (${foundNames.length}件 / 上限${CONFIG.maxFilesPerTarget}件)`
                    : undefined,
            };
          });
        })();

    const errors: string[] = [];

    for (const result of results) {
      if (result.error) {
        errors.push(`${result.targetName} (${result.error})`);
        logger.log(`  [${result.targetName}] エラー : ${result.error}`);
      }

      result.foundNames.forEach((name) => logger.log(name));
    }

    return errors.length > 0
      ? logger.needsAction(`NG: ${errors.join(", ")}`)
      : logger.complete();
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    throw logger.fail(`システムエラーが発生しました${detail}`);
  }
}

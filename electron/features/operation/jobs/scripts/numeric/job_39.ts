// electron/features/operation/jobs/scripts/numeric/job_39.ts

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

type JobResultData = {
  targetDir: string;
  isBeforeNoon: boolean;
  results: FileCheckResult[];
};

/**
 * 時間帯（午前・午後）に応じたディレクトリの対象ファイル存在・更新日を確認する。
 *
 * 業務上の要対応:
 * - 対象ファイルが存在しない、または本日更新でない場合
 * - ファイル件数が上限を超えている場合
 *
 * システムエラー:
 * - ディレクトリが存在しない、アクセス不能などのシステム障害
 */
export async function runJob39(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkTargetFiles();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  }
}

/**
 * ディレクトリ検証および対象ファイル群の存在チェックを行う。
 */
async function checkTargetFiles(): Promise<JobResultData> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const today = format(now, "yyyyMMdd");
  const targetDir = isBeforeNoon ? CONFIG.beforeNoonDir : CONFIG.afterNoonDir;

  const dirStat = await fs.stat(targetDir);
  if (!dirStat.isDirectory()) {
    throw new Error(`ディレクトリではありません: ${targetDir}`);
  }

  let results: FileCheckResult[];

  if (isBeforeNoon) {
    results = await Promise.all(
      CONFIG.targetFiles.map(async (targetName) => {
        const filePath = path.join(targetDir, targetName);

        if (!(await fs.pathExists(filePath))) {
          return {
            targetName,
            foundNames: [],
            error: "ファイルが存在しません",
          };
        }

        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
          return {
            targetName,
            foundNames: [],
            error: "ファイルではありません",
          };
        }

        const isToday = isSameDay(stats.mtime, now);
        return {
          targetName,
          foundNames: isToday ? [path.basename(filePath)] : [],
          error: isToday ? undefined : "更新日が本日ではありません",
        };
      }),
    );
  } else {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    results = CONFIG.targetFiles.map((targetName) => {
      const prefix = `${targetName}_${today}`;
      const foundNames = entries
        .filter((entry) => entry.isFile() && entry.name.startsWith(prefix))
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
  }

  return {
    targetDir,
    isBeforeNoon,
    results,
  };
}

/**
 * ログを出力し、ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.log(
    `時間帯判定       : ${result.isBeforeNoon ? "午前 (12時前)" : "午後 (12時以降)"}`,
  );
  logger.log(`対象ディレクトリ : ${result.targetDir}`);

  logger.section("確認結果");
  const errors: string[] = [];

  for (const item of result.results) {
    if (item.error) {
      errors.push(`${item.targetName} (${item.error})`);
      logger.log(`  [${item.targetName}] エラー : ${item.error}`);
    }

    for (const name of item.foundNames) {
      logger.log(name);
    }
  }

  if (errors.length > 0) {
    return logger.needsAction(`NG: ${errors.join(", ")}`);
  }

  return logger.complete();
}

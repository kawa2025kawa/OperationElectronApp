// electron/features/operation/jobs/scripts/numeric/job_39.ts

import { format, isSameDay } from "date-fns";
import path from "node:path";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  beforeNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  afterNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  targetFiles: ["Okurikomi_toMD.dat", "htsf0060"] as const,
  maxFilesPerTarget: 2,
} as const;

type FileCheckIssueType = "pending" | "needsAction";

type FileCheckResult = {
  targetName: string;
  foundNames: string[];
  error?: string;
  issueType?: FileCheckIssueType;
};

type JobResultData = {
  targetDir: string;
  isBeforeNoon: boolean;
  results: FileCheckResult[];
};

/**
 * 時間帯（午前・午後）に応じたフォルダの対象ファイル存在・更新日を確認する。
 *
 * 監視継続 (running):
 * - 対象ファイルが存在しない、または本日更新でない場合（バックグラウンドでポーリング監視）
 *
 * 業務上の要対応 (needsAction):
 * - ファイル件数が上限を超えている場合
 *
 * システムエラー:
 * - フォルダが存在しない、アクセス不能などのシステム障害
 */
export async function runJob39(): Promise<JobResult> {
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
 * フォルダ検証および対象ファイル群の存在チェックを行う。
 */
async function checkTargetFiles(): Promise<JobResultData> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const today = format(now, "yyyyMMdd");
  const targetDir = isBeforeNoon ? CONFIG.beforeNoonDir : CONFIG.afterNoonDir;

  const dirStat = await fs.stat(targetDir);
  if (!dirStat.isDirectory()) {
    throw new Error(`フォルダではありません: ${targetDir}`);
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
            error: "ファイルが存在しません（配置待ち）",
            issueType: "pending",
          };
        }

        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
          return {
            targetName,
            foundNames: [],
            error: "ファイルではありません",
            issueType: "needsAction",
          };
        }

        const isToday = isSameDay(stats.mtime, now);
        return {
          targetName,
          foundNames: isToday ? [path.basename(filePath)] : [],
          error: isToday ? undefined : "更新日が本日ではありません（更新待ち）",
          issueType: isToday ? undefined : "pending",
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

      if (foundNames.length === 0) {
        return {
          targetName,
          foundNames,
          error: `${prefix}* (ファイルなし・配置待ち)`,
          issueType: "pending",
        };
      }

      if (foundNames.length > CONFIG.maxFilesPerTarget) {
        return {
          targetName,
          foundNames,
          error: `対象ファイルが上限超過 (${foundNames.length}件 / 上限${CONFIG.maxFilesPerTarget}件)`,
          issueType: "needsAction",
        };
      }

      return {
        targetName,
        foundNames,
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
function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.log(
    `時間帯判定        : ${result.isBeforeNoon ? "午前 (12時前)" : "午後 (12時以降)"}`,
  );
  logger.log(`対象フォルダ : ${result.targetDir}`);

  logger.section("確認結果");
  const actionErrors: string[] = [];
  const pendingErrors: string[] = [];

  for (const item of result.results) {
    if (item.error) {
      const summary = `${item.targetName} (${item.error})`;
      if (item.issueType === "pending") {
        pendingErrors.push(summary);
      } else {
        actionErrors.push(summary);
      }
      logger.log(`  [${item.targetName}] ${item.error}`);
    }

    for (const name of item.foundNames) {
      logger.log(name);
    }
  }

  if (actionErrors.length > 0) {
    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(`NG: ${actionErrors.join(", ")}`),
      data: result,
    };
  }

  if (pendingErrors.length > 0) {
    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未検出・未更新 (${pendingErrors.join(", ")})。バックグラウンドで監視中`,
      ),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}

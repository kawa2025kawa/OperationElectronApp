// electron/features/operation/jobs/scripts/numeric/job_39.ts

import path from "node:path";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  directoryExists,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";
import {
  checkFileUpdatedToday,
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
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
- 時間帯（午前・午後）に応じたフォルダの対象ファイル存在・更新日を確認する。
 */
export async function runJob39(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

async function checkTargetFiles(): Promise<JobResultData> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const today = getDateKey(now);
  const targetDir = isBeforeNoon ? CONFIG.beforeNoonDir : CONFIG.afterNoonDir;

  if (!(await directoryExists(targetDir))) {
    throw new Error(`フォルダが存在しないかアクセスできません: ${targetDir}`);
  }

  let results: FileCheckResult[];

  if (isBeforeNoon) {
    results = await Promise.all(
      CONFIG.targetFiles.map(async (targetName) => {
        const status = await checkFileUpdatedToday(
          path.join(targetDir, targetName),
          now,
        );

        if (!status.exists) {
          return {
            targetName,
            foundNames: [],
            error: "ファイルが存在しません（配置待ち）",
            issueType: "pending",
          };
        }

        return {
          targetName,
          foundNames: status.isToday ? [status.fileName] : [],
          error: status.isToday
            ? undefined
            : "更新日が本日ではありません（更新待ち）",
          issueType: status.isToday ? undefined : "pending",
        };
      }),
    );
  } else {
    const fileNames = await listFilesInDir(targetDir);

    results = CONFIG.targetFiles.map((targetName) => {
      const prefix = `${targetName}_${today}`;
      const foundNames = fileNames.filter((name) => name.startsWith(prefix));

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
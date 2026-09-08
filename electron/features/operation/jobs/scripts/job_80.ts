// electron/features/operation/jobs/scripts/job_80.ts
// BENIF2200抽出ファイル存在確認

import fs from "fs-extra";
import { format } from "date-fns";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const REQUIRED_FILES = ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"] as const;

export async function runJob80(): Promise<string> {
  const jobId = "Job80";
  const startTime = Date.now();
  const getDuration = () => ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`[${jobId}] 処理開始 (Target: ${TARGET_DIR})`);

  try {
    if (!(await fs.pathExists(TARGET_DIR))) {
      throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
    }

    const files = await fs.readdir(TARGET_DIR);

    // Pattern A: 固定ファイル名のチェック
    const hasAllFixed = REQUIRED_FILES.every((target) =>
      files.some((file) => file.startsWith(target)),
    );

    if (hasAllFixed) {
      console.log(`[${jobId}] 正常終了 (${getDuration()}s): fixed files found`);
      return "2 files received";
    }

    // Pattern B: 日付付きファイル名のチェック
    console.log(
      `[${jobId}] 固定ファイルが見つからないため日付付きファイルを検索します...`,
    );
    const today = format(new Date(), "yyyyMMdd");

    const foundDated = new Set(
      REQUIRED_FILES.filter((target) =>
        files.some((file) => file.startsWith(`${target}_${today}`)),
      ),
    );

    if (foundDated.size === REQUIRED_FILES.length) {
      console.log(`[${jobId}] 正常終了 (${getDuration()}s): dated files found`);
      return "2 files received";
    }

    const missing = REQUIRED_FILES.filter((file) => !foundDated.has(file));
    throw new Error(`欠損ファイル: ${missing.join(", ")}`);
  } catch (error) {
    console.error(`[${jobId}] 異常終了 (${getDuration()}s)`, error);
    throw error;
  }
}

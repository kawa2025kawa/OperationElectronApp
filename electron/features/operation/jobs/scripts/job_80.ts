//electron\features\operation\jobs\scripts\job_80.ts

//BENIF2200抽出ファイル存在確認

import fs from "fs-extra";
import { format } from "date-fns";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const REQUIRED_FILES = ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"] as const;

export async function runJob80(): Promise<string> {
  const jobId = "Job80";
  const startTime = Date.now();

  console.log(`[${jobId}] 処理開始 (Target: ${TARGET_DIR})`);

  try {
    if (!(await fs.pathExists(TARGET_DIR))) {
      throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
    }

    const files = await fs.readdir(TARGET_DIR);

    //
    // ------------------------------------------------------------------
    // Pattern A
    // 固定ファイル
    // 例:
    //   Okurikomi_toMD_JIZEN.dat
    //   htsf0060_JIZEN
    // ------------------------------------------------------------------
    //

    const foundFixed = new Set<string>();

    for (const file of files) {
      for (const target of REQUIRED_FILES) {
        if (file.startsWith(target)) {
          foundFixed.add(target);
        }
      }

      if (foundFixed.size === REQUIRED_FILES.length) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[${jobId}] 正常終了 (${duration}s): fixed files found`);

        return "2 files received";
      }
    }

    //
    // ------------------------------------------------------------------
    // Pattern B
    // 日付付き
    // 例:
    //   Okurikomi_toMD_JIZEN_20260819
    //   htsf0060_JIZEN_20260819.dat
    // ------------------------------------------------------------------
    //

    console.log(
      `[${jobId}] 固定ファイルが見つからないため日付付きファイルを検索します...`,
    );

    const today = format(new Date(), "yyyyMMdd");

    const foundDated = new Set<string>();

    for (const file of files) {
      for (const target of REQUIRED_FILES) {
        if (file.startsWith(`${target}_${today}`)) {
          foundDated.add(target);
        }
      }

      if (foundDated.size === REQUIRED_FILES.length) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[${jobId}] 正常終了 (${duration}s): dated files found`);

        return "2 files received";
      }
    }

    const missing = REQUIRED_FILES.filter((file) => !foundDated.has(file));

    throw new Error(`欠損ファイル: ${missing.join(", ")}`);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error(`[${jobId}] 異常終了 (${duration}s)`, error);

    throw error;
  }
}

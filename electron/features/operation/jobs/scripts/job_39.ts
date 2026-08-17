// electron/services/operation/jobs/scripts/job_39.ts

import fs from "fs-extra";
import { format } from "date-fns";

const BEFORE_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const AFTER_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const TARGET_KEYWORDS = ["htsf0060", "Okurikomi_toMD"] as const;

function selectTargetDirectory(): string {
  return new Date().getHours() < 12 ? BEFORE_NOON_DIR : AFTER_NOON_DIR;
}

export async function runJob39(): Promise<string> {
  const targetDir = selectTargetDirectory();
  const today = format(new Date(), "yyyyMMdd");

  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`ディレクトリが存在しません: ${targetDir}`);
  }

  const files = await fs.readdir(targetDir);

  let hasHtsf0060 = false;
  let hasOkurikomi = false;

  for (const file of files) {
    if (!file.includes(today)) {
      continue;
    }

    if (!hasHtsf0060 && file.includes(TARGET_KEYWORDS[0])) {
      hasHtsf0060 = true;
    }

    if (!hasOkurikomi && file.includes(TARGET_KEYWORDS[1])) {
      hasOkurikomi = true;
    }

    if (hasHtsf0060 && hasOkurikomi) {
      break;
    }
  }

  if (hasHtsf0060 && hasOkurikomi) {
    return "正常終了";
  }

  const missing: string[] = [];

  if (!hasHtsf0060) {
    missing.push(TARGET_KEYWORDS[0]);
  }

  if (!hasOkurikomi) {
    missing.push(TARGET_KEYWORDS[1]);
  }

  throw new Error(`欠損ファイル: ${missing.join(", ")}`);
}

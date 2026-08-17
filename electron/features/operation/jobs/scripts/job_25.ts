// electron/services/operation/jobs/scripts/job_25.ts
import fs from "fs-extra";
import { format } from "date-fns";

// 本番環境
const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

// テスト環境
//const TARGET_DIR = "C:\\Users\\C3088091\\Desktop\\test";

const TARGET_KEYWORDS = ["htsf0060", "Okurikomi"] as const;

export async function runJob25(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const files = await fs.readdir(TARGET_DIR);

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
    return "全ファイル正常確認";
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

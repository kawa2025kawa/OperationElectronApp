// electron/services/operation/jobs/scripts/job_n12.ts

import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";

const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export async function runJobN12(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`対象フォルダが見つかりません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);

  let has098 = false;
  let has982 = false;
  let has983 = false;
  let hasSd = false;

  for (const file of files) {
    if (!has098 && file.includes(KEYWORDS[0])) has098 = true;
    if (!has982 && file.includes(KEYWORDS[1])) has982 = true;
    if (!has983 && file.includes(KEYWORDS[2])) has983 = true;
    if (!hasSd && file.includes(KEYWORDS[3])) hasSd = true;

    if (has098 && has982 && has983 && hasSd) {
      return "正常終了";
    }
  }

  const missing: string[] = [];

  if (!has098) missing.push(KEYWORDS[0]);
  if (!has982) missing.push(KEYWORDS[1]);
  if (!has983) missing.push(KEYWORDS[2]);
  if (!hasSd) missing.push(KEYWORDS[3]);

  throw new Error(`不足ファイル: ${missing.join(", ")}`);
}

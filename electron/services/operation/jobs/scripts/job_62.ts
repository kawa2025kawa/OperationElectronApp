// electron/services/operation/jobs/scripts/job_62.ts
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const EXPECTED_FILES = [
  { keyword: "htsf0060", count: 1 },
  { keyword: "Syohin_toMD_N", count: 4 },
  { keyword: "Tokusyo_toMD_N", count: 4 },
] as const;

export async function runJob62(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR))) throw new Error(`対象フォルダが見つかりません: ${TARGET_DIR}`);

  const files = await fs.readdir(TARGET_DIR);
  const isAllMatched = EXPECTED_FILES.every((rule) => {
    const actualCount = files.filter((f) => f.includes(rule.keyword)).length;
    return actualCount === rule.count;
  });

  if (isAllMatched) return "全ファイル数一致確認";
  throw new Error("ファイル数が規定と一致しません");
}

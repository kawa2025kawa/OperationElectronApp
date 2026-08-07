// electron/services/operation/jobs/scripts/job_64.ts
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMMD";
const SYSTEM_ID = "C1088241";

interface CheckResult {
  pluNg: boolean;
  skuNg: boolean;
  syohinLines: string[];
  tokusyoLines: string[];
}

export async function runJob64(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const targetDir = path.join(BASE_DIR, today);

  if (!(await fs.pathExists(targetDir))) throw new Error(`本日分のDCMMDフォルダがありません: ${targetDir}`);

  const result: CheckResult = { pluNg: true, skuNg: false, syohinLines: [], tokusyoLines: [] };
  const moveTargets: Array<{ filePath: string; fixed: boolean }> = [];
  const entries = await fs.readdir(targetDir);

  for (const entry of entries) {
    const filePath = path.join(targetDir, entry);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;

    if (entry.startsWith("PLU")) {
      const buffer = await fs.readFile(filePath);
      const text = iconv.decode(buffer, "Shift_JIS").trim();
      result.pluNg = text.length !== 12;
    } else if (entry.includes("SKU")) {
      result.skuNg = true;
    } else if (entry.startsWith("抽出済")) {
      moveTargets.push({ filePath, fixed: false });
    } else {
      const buffer = await fs.readFile(filePath);
      const text = iconv.decode(buffer, "Shift_JIS");
      let fixed = false;

      for (const line of text.split(/\r?\n/)) {
        const cols = line.split(",");
        if (cols.length < 6 || ["8", "9"].includes(cols[5]?.trim() ?? "")) continue;

        const output = cols.slice(4).join(",");
        const typeCol = cols[4]?.trim();

        if (["11", "12", "13", "14", "21"].includes(typeCol ?? "")) {
          result.syohinLines.push(output);
          fixed = true;
        } else if (["31", "32", "41", "42"].includes(typeCol ?? "")) {
          result.tokusyoLines.push(output);
          fixed = true;
        }
      }
      moveTargets.push({ filePath, fixed });
    }
  }

  if (result.syohinLines.length > 0) {
    const datPath = path.join(targetDir, `Syohin_toMD_N_${SYSTEM_ID}_${today}000000.dat`);
    const encoded = iconv.encode(result.syohinLines.join("\r\n"), "Shift_JIS");
    await fs.writeFile(datPath, encoded);
    const dmyPath = datPath.replace(/\.dat$/, ".dmy");
    if (!(await fs.pathExists(dmyPath))) await fs.copy(datPath, dmyPath);
  }

  if (result.tokusyoLines.length > 0) {
    const datPath = path.join(targetDir, `Tokusyo_toMD_N_MD_${SYSTEM_ID}_${today}000000.dat`);
    const encoded = iconv.encode(result.tokusyoLines.join("\r\n"), "Shift_JIS");
    await fs.writeFile(datPath, encoded);
    const dmyPath = datPath.replace(/\.dat$/, ".dmy");
    if (!(await fs.pathExists(dmyPath))) await fs.copy(datPath, dmyPath);
  }

  for (const { filePath, fixed } of moveTargets) {
    const destFolder = path.join(targetDir, fixed ? "抽出済" : "対象外");
    await fs.ensureDir(destFolder);
    const destPath = path.join(destFolder, path.basename(filePath));
    if (!(await fs.pathExists(destPath))) await fs.move(filePath, destPath);
  }

  const syohinNg = result.syohinLines.length > 0;
  const tokusyoNg = result.tokusyoLines.length > 0;
  const nma8100Required = result.pluNg || result.skuNg || syohinNg || tokusyoNg;

  const msg = `PLU:${result.pluNg ? "NG" : "OK"} SKU:${result.skuNg ? "NG" : "OK"} 商品:${syohinNg ? "NG" : "OK"} 特商:${tokusyoNg ? "NG" : "OK"} NMA8100:${nma8100Required ? "必要" : "不要"}`;
  if (nma8100Required) throw new Error(msg);
  return msg;
}

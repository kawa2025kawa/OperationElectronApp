// electron/services/operation/jobs/scripts/job_64.ts
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMMD";
const SYSTEM_ID = "C1088241";

const ENCODING = "Shift_JIS";
const EXCLUDED_STATUSES = new Set(["8", "9"]);

const SYOHIN_TYPES = new Set(["11", "12", "13", "14", "21"]);
const TOKUSYO_TYPES = new Set(["31", "32", "41", "42"]);

const PROCESSED_DIR = "対応済";
const EXCLUDED_DIR = "対象外";

interface CheckResult {
  pluNg: boolean;
  skuNg: boolean;
  syohinLines: string[];
  tokusyoLines: string[];
}

interface FileProcessResult {
  hasProcessableRow: boolean;
}

export async function runJob64(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const timestamp = format(now, "yyyyMMddHHmmss");
  const targetDir = path.join(BASE_DIR, today);

  await assertTargetDir(targetDir);

  const result: CheckResult = {
    pluNg: true,
    skuNg: false,
    syohinLines: [],
    tokusyoLines: [],
  };

  const moveTargets: Array<{
    filePath: string;
    processed: boolean;
  }> = [];

  const entries = await fs.readdir(targetDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fileName = entry.name;
    const filePath = path.join(targetDir, fileName);

    if (fileName.startsWith("PLU")) {
      result.pluNg ||= await checkPlu(filePath);
      continue;
    }

    const processResult = await processDataFile(filePath, result);

    if (fileName.includes("SKU")) {
      result.skuNg ||= processResult.hasProcessableRow;
    }

    moveTargets.push({
      filePath,
      processed: processResult.hasProcessableRow,
    });
  }

  await writeOutput(
    targetDir,
    `Syohin_toMD_N_${SYSTEM_ID}_${timestamp}.dat`,
    result.syohinLines,
  );

  await writeOutput(
    targetDir,
    `Tokusyo_toMD_N_MD_${SYSTEM_ID}_${timestamp}.dat`,
    result.tokusyoLines,
  );

  await moveProcessedFiles(targetDir, moveTargets);

  const syohinNg = result.syohinLines.length > 0;
  const tokusyoNg = result.tokusyoLines.length > 0;
  const nma8100Required = result.pluNg || result.skuNg || syohinNg || tokusyoNg;

  const message =
    `PLU:${result.pluNg ? "NG" : "OK"} ` +
    `SKU:${result.skuNg ? "NG" : "OK"} ` +
    `商品:${syohinNg ? "NG" : "OK"} ` +
    `特商:${tokusyoNg ? "NG" : "OK"} ` +
    `NMA8100:${nma8100Required ? "必要" : "不要"}`;

  if (nma8100Required) {
    throw new Error(message);
  }

  return message;
}

/**
 * 本日分のDCMMDフォルダが存在するか確認
 */
async function assertTargetDir(targetDir: string): Promise<void> {
  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`本日分のDCMMDフォルダがありません: ${targetDir}`);
  }
}

/**
 * PLUチェック
 *
 * 12文字ならOK、それ以外ならNG
 */
async function checkPlu(filePath: string): Promise<boolean> {
  const text = await readShiftJis(filePath);
  return text.trim().length !== 12;
}

/**
 * 商品・特商・SKUファイルを解析
 *
 * cols[5] が 8/9 の行は対象外。
 * それ以外の行が1件でも存在すれば、
 * 「対応済」へ移動する対象とする。
 */
async function processDataFile(
  filePath: string,
  result: CheckResult,
): Promise<FileProcessResult> {
  const text = await readShiftJis(filePath);
  let hasProcessableRow = false;

  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(",");

    if (cols.length < 6) continue;

    const type = cols[4]?.trim();
    const status = cols[5]?.trim();

    // 8 / 9 は対象外
    if (EXCLUDED_STATUSES.has(status)) continue;

    // 8 / 9 以外の有効行が存在
    hasProcessableRow = true;

    const output = cols.slice(4).join(",");

    if (SYOHIN_TYPES.has(type)) {
      result.syohinLines.push(output);
      continue;
    }

    if (TOKUSYO_TYPES.has(type)) {
      result.tokusyoLines.push(output);
    }
  }

  return { hasProcessableRow };
}

/**
 * Shift_JISでファイルを読み込む
 */
async function readShiftJis(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return iconv.decode(buffer, ENCODING);
}

/**
 * DAT / DMYファイルを生成
 */
async function writeOutput(
  targetDir: string,
  fileName: string,
  lines: string[],
): Promise<void> {
  if (lines.length === 0) return;

  const datPath = path.join(targetDir, fileName);
  const encoded = iconv.encode(lines.join("\r\n"), ENCODING);

  await fs.writeFile(datPath, encoded);

  const dmyPath = datPath.replace(/\.dat$/, ".dmy");

  if (!(await fs.pathExists(dmyPath))) {
    await fs.copy(datPath, dmyPath);
  }
}

/**
 * 元ファイルを対応済 / 対象外へ移動
 */
async function moveProcessedFiles(
  targetDir: string,
  moveTargets: Array<{
    filePath: string;
    processed: boolean;
  }>,
): Promise<void> {
  for (const { filePath, processed } of moveTargets) {
    const folder = processed ? PROCESSED_DIR : EXCLUDED_DIR;
    const destFolder = path.join(targetDir, folder);

    await fs.ensureDir(destFolder);

    const destPath = path.join(destFolder, path.basename(filePath));

    if (await fs.pathExists(destPath)) continue;

    await fs.move(filePath, destPath);
  }
}

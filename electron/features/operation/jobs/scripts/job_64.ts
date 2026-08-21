// electron/services/operation/jobs/scripts/job_64.ts
//NMA8000エラーログ確認

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

//const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMMD";
const BASE_DIR = "C:\\Users\\C3088091\\Desktop\\test\\NMA8000エラーログ";
const SYSTEM_ID = "C1088241";

const ENCODING = "Shift_JIS";
const EXCLUDED_STATUSES = new Set(["8", "9"]);

const SYOHIN_TYPES = new Set(["11", "12", "13", "14", "21"]);
const TOKUSYO_TYPES = new Set(["31", "32", "41", "42"]);

const PROCESSED_DIR = "対応済";
const EXCLUDED_DIR = "対応不要";

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
  console.log("[Job64] ========== ジョブ処理を開始します ==========");
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const timestamp = format(now, "yyyyMMddHHmmss");
  const targetDir = path.join(BASE_DIR, today);

  console.log(`[Job64] 実行日時: ${format(now, "yyyy-MM-dd HH:mm:ss")}`);
  console.log(`[Job64] ターゲットフォルダ: ${targetDir}`);

  await assertTargetDir(targetDir);

  const result: CheckResult = {
    pluNg: false, // 初期値はfalseで保持（ファイル存在時のみチェック結果で更新）
    skuNg: false,
    syohinLines: [],
    tokusyoLines: [],
  };

  const moveTargets: Array<{
    filePath: string;
    processed: boolean;
  }> = [];

  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  console.log(`[Job64] 検出されたファイル/エントリ数: ${entries.length}`);

  for (const entry of entries) {
    if (!entry.isFile()) {
      console.log(`[Job64] スキップ (ディレクトリ): ${entry.name}`);
      continue;
    }

    const fileName = entry.name;
    const filePath = path.join(targetDir, fileName);
    console.log(`\n[Job64] --- ファイル処理中: ${fileName} ---`);

    if (fileName.startsWith("PLU")) {
      const isPluNg = await checkPlu(filePath);
      result.pluNg ||= isPluNg;
      console.log(`[Job64] PLUファイル判定: ${isPluNg ? "NG" : "OK"}`);
      continue;
    }

    const processResult = await processDataFile(filePath, result);

    if (fileName.includes("SKU")) {
      result.skuNg ||= processResult.hasProcessableRow;
      console.log(
        `[Job64] SKUファイル判定: ${processResult.hasProcessableRow ? "処理対象行あり (NG)" : "対象行なし"}`,
      );
    }

    moveTargets.push({
      filePath,
      processed: processResult.hasProcessableRow,
    });
  }

  console.log("\n[Job64] --- 出力ファイル生成 ---");
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

  console.log("\n[Job64] --- ファイル移動処理 ---");
  await moveProcessedFiles(targetDir, moveTargets);

  const syohinNg = result.syohinLines.length > 0;
  const tokusyoNg = result.tokusyoLines.length > 0;
  const nma8100Required = result.pluNg || result.skuNg || syohinNg || tokusyoNg;

  console.log("\n[Job64] --- 集計・最終判定結果 ---");
  console.log(`[Job64] PLU判定 : ${result.pluNg ? "NG" : "OK"}`);
  console.log(`[Job64] SKU判定 : ${result.skuNg ? "NG" : "OK"}`);
  console.log(
    `[Job64] 商品判定: ${syohinNg ? "NG" : "OK"} (行数: ${result.syohinLines.length})`,
  );
  console.log(
    `[Job64] 特商判定: ${tokusyoNg ? "NG" : "OK"} (行数: ${result.tokusyoLines.length})`,
  );
  console.log(`[Job64] NMA8100要否: ${nma8100Required ? "必要" : "不要"}`);

  const message =
    `PLU:${result.pluNg ? "NG" : "OK"} ` +
    `SKU:${result.skuNg ? "NG" : "OK"} ` +
    `商品:${syohinNg ? "NG" : "OK"} ` +
    `特商:${tokusyoNg ? "NG" : "OK"} ` +
    `NMA8100:${nma8100Required ? "必要" : "不要"}`;

  if (nma8100Required) {
    console.error(`[Job64] エラー終了 (NMA8100が必要): ${message}`);
    throw new Error(message);
  }

  console.log(`[Job64] 正常終了: ${message}`);
  return message;
}

/**
 * 本日分のDCMMDフォルダが存在するか確認
 */
async function assertTargetDir(targetDir: string): Promise<void> {
  const exists = await fs.pathExists(targetDir);
  console.log(
    `[Job64] フォルダ存在チェック: ${targetDir} -> ${exists ? "存在する" : "存在しない"}`,
  );
  if (!exists) {
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
  const trimmed = text.trim();
  const isNg = trimmed.length !== 12;
  console.log(
    `[Job64] [PLU Check] 文字長: ${trimmed.length} / 内容: "${trimmed}" -> ${isNg ? "NG" : "OK"}`,
  );
  return isNg;
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
  const lines = text.split(/\r?\n/);

  let processedCount = 0;
  let excludedCount = 0;
  let syohinMatchedCount = 0;
  let tokusyoMatchedCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const cols = line.split(",");

    if (cols.length < 6) {
      console.log(
        `[Job64] [Skip] カラム数不足 (${cols.length} < 6): "${line}"`,
      );
      continue;
    }

    const type = cols[4]?.trim();
    const status = cols[5]?.trim();

    // 8 / 9 は対象外
    if (EXCLUDED_STATUSES.has(status)) {
      excludedCount++;
      continue;
    }

    // 8 / 9 以外の有効行が存在
    hasProcessableRow = true;
    processedCount++;

    const output = cols.slice(4).join(",");

    if (SYOHIN_TYPES.has(type)) {
      result.syohinLines.push(output);
      syohinMatchedCount++;
      continue;
    }

    if (TOKUSYO_TYPES.has(type)) {
      result.tokusyoLines.push(output);
      tokusyoMatchedCount++;
    }
  }

  console.log(
    `[Job64] [Parse Summary] 総行数:${lines.length} | 処理対象:${processedCount} | 対象外ステータス(8/9):${excludedCount} | 商品マッチ:${syohinMatchedCount} | 特商マッチ:${tokusyoMatchedCount}`,
  );

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
  if (lines.length === 0) {
    console.log(
      `[Job64] [Output Skip] 書き込み行数が0件のためスキップ: ${fileName}`,
    );
    return;
  }

  const datPath = path.join(targetDir, fileName);
  const encoded = iconv.encode(lines.join("\r\n"), ENCODING);

  await fs.writeFile(datPath, encoded);
  console.log(`[Job64] [DAT作成] ${datPath} (${lines.length} 行)`);

  const dmyPath = datPath.replace(/\.dat$/, ".dmy");

  if (!(await fs.pathExists(dmyPath))) {
    await fs.copy(datPath, dmyPath);
    console.log(`[Job64] [DMY作成] ${dmyPath}`);
  } else {
    console.log(`[Job64] [DMYスキップ] すでに存在します: ${dmyPath}`);
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

    const baseName = path.basename(filePath);
    const destPath = path.join(destFolder, baseName);

    if (await fs.pathExists(destPath)) {
      console.log(
        `[Job64] [Move Skip] 移動先に同名ファイルが既に存在するためスキップ: ${destPath}`,
      );
      continue;
    }

    await fs.move(filePath, destPath);
    console.log(`[Job64] [Move Success] ${baseName} -> ${folder}/`);
  }
}

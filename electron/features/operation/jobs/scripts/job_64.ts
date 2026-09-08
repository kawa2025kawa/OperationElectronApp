// electron/features/operation/jobs/scripts/job_64.ts
// NMA8000エラーログ確認

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

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

interface MoveTarget {
  filePath: string;
  processed: boolean;
}

export async function runJob64(): Promise<string> {
  console.log("[Job64] ========== ジョブ処理を開始します ==========");
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const timestamp = format(now, "yyyyMMddHHmmss");
  const targetDir = path.join(BASE_DIR, today);

  console.log(`[Job64] 実行日時: ${format(now, "yyyy-MM-dd HH:mm:ss")}`);
  console.log(`[Job64] ターゲットフォルダ: ${targetDir}`);

  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`本日分のDCMMDフォルダがありません: ${targetDir}`);
  }

  const result: CheckResult = {
    pluNg: false,
    skuNg: false,
    syohinLines: [],
    tokusyoLines: [],
  };
  const moveTargets: MoveTarget[] = [];
  const entries = await fs.readdir(targetDir, { withFileTypes: true });

  console.log(`[Job64] 検出されたファイル/エントリ数: ${entries.length}`);

  for (const entry of entries.filter((e) => e.isFile())) {
    const fileName = entry.name;
    const filePath = path.join(targetDir, fileName);
    console.log(`\n[Job64] --- ファイル処理中: ${fileName} ---`);

    if (fileName.startsWith("PLU")) {
      const isNg = (await readShiftJis(filePath)).trim().length !== 12;
      result.pluNg ||= isNg;
      console.log(`[Job64] [PLU Check] -> ${isNg ? "NG" : "OK"}`);
      continue;
    }

    const { hasProcessableRow } = await processDataFile(filePath, result);

    if (fileName.includes("SKU")) {
      result.skuNg ||= hasProcessableRow;
      console.log(
        `[Job64] SKUファイル判定: ${hasProcessableRow ? "処理対象行あり (NG)" : "対象行なし"}`,
      );
    }

    if (isPluDuplicateFile(fileName)) {
      console.log(
        `[Job64] [移動非対象] ＰＬＵ重複ファイルのため移動対象から除外: ${fileName}`,
      );
      continue;
    }

    moveTargets.push({ filePath, processed: hasProcessableRow });
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

  // モーダル表示用メッセージの組み立て
  const summaryLines: string[] = [
    "【判定結果】",
    `PLU: ${result.pluNg ? "NG" : "OK"} | SKU: ${result.skuNg ? "NG" : "OK"} | 商品: ${syohinNg ? "NG" : "OK"} | 特商: ${tokusyoNg ? "NG" : "OK"}`,
    `NMA8100: ${nma8100Required ? "必要" : "不要"}`,
  ];

  if (moveTargets.length > 0) {
    summaryLines.push("\n【処理ファイル】");
    moveTargets.forEach((target) => {
      const fileName = path.basename(target.filePath);
      const dest = target.processed ? PROCESSED_DIR : EXCLUDED_DIR;
      summaryLines.push(`・${fileName} (${dest})`);
    });
  }

  const modalMessage = summaryLines.join("\n");

  if (nma8100Required) {
    console.error(`[Job64] エラー終了 (NMA8100が必要):\n${modalMessage}`);
    throw new Error(`NMA8100要対応:\n${modalMessage}`);
  }

  console.log(`[Job64] 正常終了:\n${modalMessage}`);
  return `確認完了:\n${modalMessage}`;
}

// ヘルパー関数
const isPluDuplicateFile = (name: string) =>
  name.normalize("NFKC").includes("PLU重複");
const readShiftJis = async (p: string) =>
  iconv.decode(await fs.readFile(p), ENCODING);

async function processDataFile(filePath: string, result: CheckResult) {
  const text = await readShiftJis(filePath);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let [processedCount, excludedCount, syohinCount, tokusyoCount] = [0, 0, 0, 0];
  let hasProcessableRow = false;

  for (const line of lines) {
    const cols = line.split(",");
    if (cols.length < 6) continue;

    const [type, status] = [cols[4]?.trim(), cols[5]?.trim()];
    if (EXCLUDED_STATUSES.has(status)) {
      excludedCount++;
      continue;
    }

    hasProcessableRow = true;
    processedCount++;
    const output = cols.slice(4).join(",");

    if (SYOHIN_TYPES.has(type)) {
      result.syohinLines.push(output);
      syohinCount++;
    } else if (TOKUSYO_TYPES.has(type)) {
      result.tokusyoLines.push(output);
      tokusyoCount++;
    }
  }

  console.log(
    `[Job64] [Parse Summary] 総行数:${lines.length} | 処理対象:${processedCount} | 対象外ステータス(8/9):${excludedCount} | 商品マッチ:${syohinCount} | 特商マッチ:${tokusyoCount}`,
  );
  return { hasProcessableRow };
}

async function writeOutput(
  targetDir: string,
  fileName: string,
  lines: string[],
) {
  if (lines.length === 0) {
    console.log(
      `[Job64] [Output Skip] 書き込み行数が0件のためスキップ: ${fileName}`,
    );
    return;
  }
  const datPath = path.join(targetDir, fileName);
  await fs.writeFile(datPath, iconv.encode(lines.join("\r\n"), ENCODING));
  console.log(`[Job64] [DAT作成] ${datPath} (${lines.length} 行)`);

  const dmyPath = datPath.replace(/\.dat$/, ".dmy");
  if (!(await fs.pathExists(dmyPath))) {
    await fs.copy(datPath, dmyPath);
    console.log(`[Job64] [DMY作成] ${dmyPath}`);
  }
}

async function moveProcessedFiles(
  targetDir: string,
  moveTargets: MoveTarget[],
) {
  for (const { filePath, processed } of moveTargets) {
    const baseName = path.basename(filePath);
    if (isPluDuplicateFile(baseName)) continue;

    const destFolder = path.join(
      targetDir,
      processed ? PROCESSED_DIR : EXCLUDED_DIR,
    );
    await fs.ensureDir(destFolder);

    const destPath = path.join(destFolder, baseName);
    if (await fs.pathExists(destPath)) {
      console.log(
        `[Job64] [Move Skip] 移動先に同名ファイルが存在するためスキップ: ${destPath}`,
      );
      continue;
    }

    await fs.move(filePath, destPath);
    console.log(
      `[Job64] [Move Success] ${baseName} -> ${processed ? PROCESSED_DIR : EXCLUDED_DIR}/`,
    );
  }
}

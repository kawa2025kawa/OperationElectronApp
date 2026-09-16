// electron/features/operation/jobs/scripts/job_64.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMMD";

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
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const timestamp = format(now, "yyyyMMddHHmmss");
  const targetDir = path.join(BASE_DIR, today);
  const outputLines: string[] = [];

  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job64] NMA8000エラーログ確認・振分 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 監視フォルダ: ${targetDir}`);

  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`本日分のDCMMDフォルダが存在しません: ${targetDir}`);
  }

  const result: CheckResult = {
    pluNg: false,
    skuNg: false,
    syohinLines: [],
    tokusyoLines: [],
  };
  const moveTargets: MoveTarget[] = [];
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const fileEntries = entries.filter((e) => e.isFile());

  addLine(`▶ 検出ファイル数: 計 ${fileEntries.length} 件`);
  addLine();

  for (const entry of fileEntries) {
    const fileName = entry.name;
    const filePath = path.join(targetDir, fileName);
    const stat = await fs.stat(filePath);
    const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");

    addLine(`▶ 対象ファイル: ${fileName}`);
    addLine(`   └ 更新日時: ${formattedDate}`);

    if (fileName.startsWith("PLU")) {
      const isNg = (await readShiftJis(filePath)).trim().length !== 12;
      result.pluNg ||= isNg;
      addLine(`   └ 判定: PLUチェック -> ${isNg ? "❌ NG (桁数不備)" : "OK"}`);
      continue;
    }

    const { hasProcessableRow } = await processDataFile(filePath, result);

    if (fileName.includes("SKU")) {
      result.skuNg ||= hasProcessableRow;
      addLine(
        `   └ 判定: SKUチェック -> ${hasProcessableRow ? "❌ NG (処理対象行あり)" : "OK"}`,
      );
    }

    if (isPluDuplicateFile(fileName)) {
      addLine(`   └ 判定: PLU重複ファイルのため移動スキップ`);
      continue;
    }

    moveTargets.push({ filePath, processed: hasProcessableRow });
  }

  addLine();
  addLine(`--------------------------------------------------`);
  addLine(` 📄 出力ファイル生成結果`);

  const syohinDatName = `Syohin_toMD_N_${SYSTEM_ID}_${timestamp}.dat`;
  const tokusyoDatName = `Tokusyo_toMD_N_MD_${SYSTEM_ID}_${timestamp}.dat`;

  const createdSyohin = await writeOutput(
    targetDir,
    syohinDatName,
    result.syohinLines,
  );
  if (createdSyohin) {
    addLine(
      ` ▶ [商品DAT] 生成完了: ${syohinDatName} (${result.syohinLines.length} 行)`,
    );
  } else {
    addLine(` ▶ [商品DAT] スキップ (対象行なし)`);
  }

  const createdTokusyo = await writeOutput(
    targetDir,
    tokusyoDatName,
    result.tokusyoLines,
  );
  if (createdTokusyo) {
    addLine(
      ` ▶ [特商DAT] 生成完了: ${tokusyoDatName} (${result.tokusyoLines.length} 行)`,
    );
  } else {
    addLine(` ▶ [特商DAT] スキップ (対象行なし)`);
  }

  await moveProcessedFiles(targetDir, moveTargets);

  const syohinNg = result.syohinLines.length > 0;
  const tokusyoNg = result.tokusyoLines.length > 0;
  const nma8100Required = result.pluNg || result.skuNg || syohinNg || tokusyoNg;

  addLine();
  addLine(`--------------------------------------------------`);
  addLine(` 📊 判定サマリー`);
  addLine(`   ├ PLU判定   : ${result.pluNg ? "❌ NG" : "OK"}`);
  addLine(`   ├ SKU判定   : ${result.skuNg ? "❌ NG" : "OK"}`);
  addLine(
    `   ├ 商品判定  : ${syohinNg ? "❌ NG" : "OK"} (${result.syohinLines.length} 行)`,
  );
  addLine(
    `   ├ 特商判定  : ${tokusyoNg ? "❌ NG" : "OK"} (${result.tokusyoLines.length} 行)`,
  );
  addLine(`   └ NMA8100要否: ${nma8100Required ? "⚠️ 必要" : "不要"}`);

  if (moveTargets.length > 0) {
    addLine();
    addLine(`【移動処理実績】`);
    moveTargets.forEach((target) => {
      const fileName = path.basename(target.filePath);
      const dest = target.processed ? PROCESSED_DIR : EXCLUDED_DIR;
      addLine(` ・${fileName} -> ${dest}/`);
    });
  }

  addLine(`--------------------------------------------------`);

  if (nma8100Required) {
    throw new Error(`NMA8100要対応\n\n${outputLines.join("\n")}`);
  }

  addLine(` [Job64] 正常終了 (NMA8100不要)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}

// ヘルパー関数
const isPluDuplicateFile = (name: string) =>
  name.normalize("NFKC").includes("PLU重複");
const readShiftJis = async (p: string) =>
  iconv.decode(await fs.readFile(p), ENCODING);

async function processDataFile(filePath: string, result: CheckResult) {
  const text = await readShiftJis(filePath);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let hasProcessableRow = false;

  for (const line of lines) {
    const cols = line.split(",");
    if (cols.length < 6) continue;

    const [type, status] = [cols[4]?.trim(), cols[5]?.trim()];
    if (EXCLUDED_STATUSES.has(status)) {
      continue;
    }

    hasProcessableRow = true;
    const output = cols.slice(4).join(",");

    if (SYOHIN_TYPES.has(type)) {
      result.syohinLines.push(output);
    } else if (TOKUSYO_TYPES.has(type)) {
      result.tokusyoLines.push(output);
    }
  }

  return { hasProcessableRow };
}

async function writeOutput(
  targetDir: string,
  fileName: string,
  lines: string[],
): Promise<boolean> {
  if (lines.length === 0) return false;

  const datPath = path.join(targetDir, fileName);
  await fs.writeFile(datPath, iconv.encode(lines.join("\r\n"), ENCODING));

  const dmyPath = datPath.replace(/\.dat$/, ".dmy");
  if (!(await fs.pathExists(dmyPath))) {
    await fs.copy(datPath, dmyPath);
  }

  return true;
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
      continue;
    }

    await fs.move(filePath, destPath);
  }
}

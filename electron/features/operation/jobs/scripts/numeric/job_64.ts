// electron/features/operation/jobs/scripts/numeric/job_64.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getFileInfo,
  moveFile,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  baseDir: "\\\\172.25.101.51\\if\\LOG\\DCMMD",
  systemId: "C1088241",
  encoding: "Shift_JIS",
  excludedStatuses: new Set(["8", "9"]),
  syohinTypes: new Set(["11", "12", "13", "14", "21"]),
  tokusyoTypes: new Set(["31", "32", "41", "42"]),
  processedDir: "対応済",
  excludedDir: "対応不要",
} as const;

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

function isPluDuplicateFile(name: string): boolean {
  return name.normalize("NFKC").includes("PLU重複");
}

async function readShiftJis(filePath: string): Promise<string> {
  return iconv.decode(await fs.readFile(filePath), CONFIG.encoding);
}

async function processDataFile(
  filePath: string,
  result: CheckResult,
): Promise<{ hasProcessableRow: boolean }> {
  const text = await readShiftJis(filePath);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  let hasProcessableRow = false;

  for (const line of lines) {
    const columns = line.split(",");

    if (columns.length < 6) {
      continue;
    }

    const type = columns[4]?.trim();
    const status = columns[5]?.trim();

    if (CONFIG.excludedStatuses.has(status)) {
      continue;
    }

    hasProcessableRow = true;

    const output = columns.slice(4).join(",");

    if (CONFIG.syohinTypes.has(type)) {
      result.syohinLines.push(output);
    } else if (CONFIG.tokusyoTypes.has(type)) {
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
  if (lines.length === 0) {
    return false;
  }

  const datPath = path.join(targetDir, fileName);

  await fs.writeFile(
    datPath,
    iconv.encode(lines.join("\r\n"), CONFIG.encoding),
  );

  const dmyPath = datPath.replace(/\.dat$/, ".dmy");

  if (!(await directoryExists(dmyPath))) {
    await fs.copy(datPath, dmyPath);
  }

  return true;
}

async function moveProcessedFiles(
  targetDir: string,
  moveTargets: MoveTarget[],
): Promise<void> {
  for (const { filePath, processed } of moveTargets) {
    const fileName = path.basename(filePath);

    if (isPluDuplicateFile(fileName)) {
      continue;
    }

    const destinationDir = path.join(
      targetDir,
      processed ? CONFIG.processedDir : CONFIG.excludedDir,
    );
    const destinationPath = path.join(destinationDir, fileName);

    await fs.ensureDir(destinationDir);

    // 移動先に同名ファイルがある場合は従来どおりスキップ
    if (await directoryExists(destinationPath)) {
      continue;
    }

    await moveFile(filePath, destinationDir);
  }
}

export async function runJob64(): Promise<string> {
  const now = new Date();
  const today = getDateKey(now);
  const timestamp = getDateKey(now, "yyyyMMddHHmmss");
  const targetDir = path.join(CONFIG.baseDir, today);
  const logger = new JobLogger();

  logger.log(`監視フォルダ: ${targetDir}`);

  if (!(await directoryExists(targetDir))) {
    throw logger.fail(`本日分のDCMMDフォルダが存在しません: ${targetDir}`);
  }

  const result: CheckResult = {
    pluNg: false,
    skuNg: false,
    syohinLines: [],
    tokusyoLines: [],
  };

  const moveTargets: MoveTarget[] = [];
  const entries = await findFiles(targetDir);

  logger.log(`検出ファイル数: 計 ${entries.length} 件`);

  for (const filePath of entries) {
    const info = await getFileInfo(filePath);
    const fileName = info.fileName;

    logger.log(`対象ファイル: ${fileName}`);
    logger.log(`更新日時: ${format(info.mtime, "yyyy/MM/dd HH:mm:ss")}`);

    if (fileName.startsWith("PLU")) {
      const isNg = (await readShiftJis(filePath)).trim().length !== 12;

      result.pluNg ||= isNg;

      logger.log(`判定: PLUチェック -> ${isNg ? "NG (桁数不備)" : "OK"}`);

      continue;
    }

    const { hasProcessableRow } = await processDataFile(filePath, result);

    if (fileName.includes("SKU")) {
      result.skuNg ||= hasProcessableRow;

      logger.log(
        `判定: SKUチェック -> ${hasProcessableRow ? "NG (処理対象行あり)" : "OK"}`,
      );
    }

    if (isPluDuplicateFile(fileName)) {
      logger.log("PLU重複ファイルのため移動スキップ");
      continue;
    }

    moveTargets.push({
      filePath,
      processed: hasProcessableRow,
    });
  }

  logger.section("出力ファイル生成結果");

  const syohinDatName = `Syohin_toMD_N_${CONFIG.systemId}_${timestamp}.dat`;
  const tokusyoDatName = `Tokusyo_toMD_N_MD_${CONFIG.systemId}_${timestamp}.dat`;

  const createdSyohin = await writeOutput(
    targetDir,
    syohinDatName,
    result.syohinLines,
  );

  logger.log(
    createdSyohin
      ? `[商品DAT] 生成完了: ${syohinDatName} (${result.syohinLines.length} 行)`
      : "[商品DAT] スキップ (対象行なし)",
  );

  const createdTokusyo = await writeOutput(
    targetDir,
    tokusyoDatName,
    result.tokusyoLines,
  );

  logger.log(
    createdTokusyo
      ? `[特商DAT] 生成完了: ${tokusyoDatName} (${result.tokusyoLines.length} 行)`
      : "[特商DAT] スキップ (対象行なし)",
  );

  await moveProcessedFiles(targetDir, moveTargets);

  const syohinNg = result.syohinLines.length > 0;
  const tokusyoNg = result.tokusyoLines.length > 0;
  const nma8100Required = result.pluNg || result.skuNg || syohinNg || tokusyoNg;

  logger.section("判定サマリー");
  logger.log(`PLU判定: ${result.pluNg ? "NG" : "OK"}`);
  logger.log(`SKU判定: ${result.skuNg ? "NG" : "OK"}`);
  logger.log(
    `商品判定: ${syohinNg ? "NG" : "OK"} (${result.syohinLines.length} 行)`,
  );
  logger.log(
    `特商判定: ${tokusyoNg ? "NG" : "OK"} (${result.tokusyoLines.length} 行)`,
  );
  logger.log(`NMA8100要否: ${nma8100Required ? "必要" : "不要"}`);

  if (moveTargets.length > 0) {
    logger.section("移動処理実績");

    for (const target of moveTargets) {
      const fileName = path.basename(target.filePath);
      const destination = target.processed
        ? CONFIG.processedDir
        : CONFIG.excludedDir;

      logger.log(`${fileName} -> ${destination}/`);
    }
  }

  if (nma8100Required) {
    throw logger.fail("NMA8100要対応");
  }

  return logger.complete("正常終了 (NMA8100不要)");
}

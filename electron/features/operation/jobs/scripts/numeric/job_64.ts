// electron/features/operation/jobs/scripts/numeric/job_64.ts

// 戻り値を JobResult に統一して、要対応判定が scriptRunner.ts で失われないようにする。

import fs from "fs-extra";
import path from "node:path";
import { format } from "date-fns";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  //baseDir: "\\\\172.25.101.51\\if\\LOG\\DCMMD",
  baseDir: "C:\\Users\\C3088091\\Desktop\\test",
  systemId: "C1088241",
  encoding: "Shift_JIS",
  pluEncoding: "EUC-JP",
  excludedStatuses: new Set(["8", "9"]),
  syohinTypes: new Set(["11", "12", "13", "14", "21"]),
  tokusyoTypes: new Set(["31", "32", "41", "42"]),
  pluDuplicatePrefix: "ＰＬＵ重複",
  skuKeyword: "ＳＫＵ",
  shelfPrefix: "棚",
  processedDir: "対応済",
  excludedDir: "対応不要",
} as const;

const OUTPUT_TARGET_CONFIG = [
  { type: "syohin", prefix: "Syohin_toMD_N_", label: "商品DAT" },
  { type: "tokusyo", prefix: "Tokusyo_toMD_N_MD_", label: "特商DAT" },
] as const;

type OutputType = "syohin" | "tokusyo";

interface CheckResult {
  pluNg: boolean;
  skuNg: boolean;
  syohinNg: boolean;
  tokusyoNg: boolean;
}

interface JobContext {
  targetDir: string;
  date: string;
  result: CheckResult;
}

interface OutputTarget {
  type: OutputType;
  fileName: string;
}

interface ProcessedFileResult {
  processed: boolean;
  lastOutputType: OutputType | null;
}

function createJobContext(now: Date): JobContext {
  return {
    targetDir: path.join(CONFIG.baseDir, format(now, "yyyyMMdd")),
    date: format(now, "yyyyMMdd"),
    result: {
      pluNg: false,
      skuNg: false,
      syohinNg: false,
      tokusyoNg: false,
    },
  };
}

function getOutputType(type: string): OutputType | null {
  if (CONFIG.syohinTypes.has(type)) return "syohin";
  if (CONFIG.tokusyoTypes.has(type)) return "tokusyo";
  return null;
}

function getDmyPath(datPath: string): string {
  return datPath.replace(/\.dat$/i, ".dmy");
}

function isOutputFile(fileName: string): boolean {
  return OUTPUT_TARGET_CONFIG.some(
    ({ prefix }) =>
      fileName.startsWith(`${prefix}${CONFIG.systemId}_`) &&
      /\.(dat|dmy)$/i.test(fileName),
  );
}

async function getInputFilePaths(targetDir: string): Promise<string[]> {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && !isOutputFile(entry.name))
    .map((entry) => path.join(targetDir, entry.name));
}

async function createOutputTarget(
  targetDir: string,
  date: string,
  type: OutputType,
  prefix: string,
): Promise<OutputTarget> {
  for (let sequence = 0; sequence <= 999999; sequence += 1) {
    const timestamp = `${date}${String(sequence).padStart(6, "0")}`;
    const fileName = `${prefix}${CONFIG.systemId}_${timestamp}.dat`;
    const datPath = path.join(targetDir, fileName);

    if (
      !(await fs.pathExists(datPath)) &&
      !(await fs.pathExists(getDmyPath(datPath)))
    ) {
      return { type, fileName };
    }
  }

  throw new Error(`${prefix}の出力可能な連番がありません`);
}

async function createOutputTargets(
  targetDir: string,
  date: string,
): Promise<OutputTarget[]> {
  return Promise.all(
    OUTPUT_TARGET_CONFIG.map(({ type, prefix }) =>
      createOutputTarget(targetDir, date, type, prefix),
    ),
  );
}

async function moveFile(
  filePath: string,
  targetDir: string,
  directoryName: string,
): Promise<boolean> {
  const destinationDir = path.join(targetDir, directoryName);
  const destinationPath = path.join(destinationDir, path.basename(filePath));

  await fs.ensureDir(destinationDir);

  if (await fs.pathExists(destinationPath)) return false;

  await fs.move(filePath, destinationPath);
  return true;
}

async function processPluFile(
  filePath: string,
  context: JobContext,
): Promise<void> {
  const buffer = await fs.readFile(filePath);
  const text = iconv.decode(buffer, CONFIG.pluEncoding);

  context.result.pluNg = text.length !== 12;
}

function extractOutputLine(line: string): string {
  let position = 0;

  for (let count = 0; count < 4; count += 1) {
    const commaPosition = line.indexOf(",", position);
    if (commaPosition < 0) return line;
    position = commaPosition + 1;
  }

  return line.slice(position);
}

async function appendOutputLine(
  targetDir: string,
  target: OutputTarget,
  line: string,
): Promise<void> {
  const outputPath = path.join(targetDir, target.fileName);
  await fs.appendFile(outputPath, iconv.encode(`${line}\r\n`, CONFIG.encoding));
}

async function processTextFile(
  filePath: string,
  context: JobContext,
  outputTargets: OutputTarget[],
): Promise<ProcessedFileResult> {
  const buffer = await fs.readFile(filePath);
  const text = iconv.decode(buffer, CONFIG.encoding);
  let processed = false;
  let lastOutputType: OutputType | null = null;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const columns = line.split(",");
    if (columns.length < 6) continue;

    const type = columns[4]?.trim() ?? "";
    const status = columns[5]?.trim() ?? "";

    if (CONFIG.excludedStatuses.has(status)) continue;

    const outputType = getOutputType(type);
    if (outputType === null) continue;

    const outputTarget = outputTargets.find(
      (target) => target.type === outputType,
    );
    if (!outputTarget) continue;

    await appendOutputLine(
      context.targetDir,
      outputTarget,
      extractOutputLine(line),
    );

    processed = true;
    lastOutputType = outputType;

    if (outputType === "syohin") {
      context.result.syohinNg = true;
    } else {
      context.result.tokusyoNg = true;
    }
  }

  return { processed, lastOutputType };
}

async function finalizeTextFile(
  filePath: string,
  context: JobContext,
  outputTargets: OutputTarget[],
  fileResult: ProcessedFileResult,
): Promise<void> {
  await moveFile(
    filePath,
    context.targetDir,
    fileResult.processed ? CONFIG.processedDir : CONFIG.excludedDir,
  );

  if (!fileResult.processed || fileResult.lastOutputType === null) return;

  const outputTarget = outputTargets.find(
    (target) => target.type === fileResult.lastOutputType,
  );
  if (!outputTarget) return;

  const datPath = path.join(context.targetDir, outputTarget.fileName);

  if (await fs.pathExists(datPath)) {
    await fs.copy(datPath, getDmyPath(datPath), { overwrite: true });
  }
}

async function processFile(
  filePath: string,
  context: JobContext,
  outputTargets: OutputTarget[],
): Promise<void> {
  const fileName = path.basename(filePath);

  if (fileName.startsWith(CONFIG.pluDuplicatePrefix)) {
    await processPluFile(filePath, context);
    return;
  }

  if (fileName.includes(CONFIG.skuKeyword)) {
    context.result.skuNg = true;
    return;
  }

  if (fileName.startsWith(CONFIG.shelfPrefix)) {
    await moveFile(filePath, context.targetDir, CONFIG.excludedDir);
    return;
  }

  const fileResult = await processTextFile(filePath, context, outputTargets);

  await finalizeTextFile(filePath, context, outputTargets, fileResult);
}

function createSuccessResult(logger: JobLogger, summary?: string): JobResult {
  return {
    success: true,
    kind: "success",
    message: logger.complete(summary),
  };
}

function createNeedsActionResult(
  logger: JobLogger,
  summary: string,
): JobResult {
  return {
    success: true,
    kind: "needsAction",
    message: logger.needsAction(summary),
  };
}

function createFinalResult(logger: JobLogger, context: JobContext): JobResult {
  const { pluNg, skuNg, syohinNg, tokusyoNg } = context.result;

  return pluNg || skuNg || syohinNg || tokusyoNg
    ? createNeedsActionResult(logger, "")
    : createSuccessResult(logger);
}

async function executeJob(
  logger: JobLogger,
  context: JobContext,
): Promise<JobResult> {
  logger.log(`監視フォルダ: ${context.targetDir}`);

  if (!(await fs.pathExists(context.targetDir))) {
    return createNeedsActionResult(
      logger,
      `本日分のDCMMDフォルダが存在しません: ${context.targetDir}`,
    );
  }

  const stats = await fs.stat(context.targetDir);
  if (!stats.isDirectory()) {
    return createNeedsActionResult(
      logger,
      `本日分のDCMMDフォルダが存在しません: ${context.targetDir}`,
    );
  }

  const filePaths = await getInputFilePaths(context.targetDir);
  logger.log(`検出ファイル数: 計 ${filePaths.length} 件`);

  if (filePaths.length === 0) {
    return createNeedsActionResult(logger, "ファイルがありません");
  }

  const outputTargets = await createOutputTargets(
    context.targetDir,
    context.date,
  );

  for (const filePath of filePaths) {
    await processFile(filePath, context, outputTargets);
  }

  for (const target of outputTargets) {
    if (!(await fs.pathExists(path.join(context.targetDir, target.fileName)))) {
      continue;
    }

    const targetConfig = OUTPUT_TARGET_CONFIG.find(
      (item) => item.type === target.type,
    );

    logger.log(
      `[${targetConfig?.label ?? target.type}] 生成完了: ${target.fileName}`,
    );
  }

  return createFinalResult(logger, context);
}

export async function runJob64(): Promise<JobResult> {
  const logger = new JobLogger();
  const context = createJobContext(new Date());

  try {
    return await executeJob(logger, context);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw logger.fail(`システムエラーが発生しました: ${detail}`);
  }
}

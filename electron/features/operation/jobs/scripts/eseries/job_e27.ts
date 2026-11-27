// electron/features/operation/jobs/scripts/eseries/job_e27.ts

import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  resolveSingleInputFile,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { ScriptFilePath } from "@electron/features/operation/runners/scriptRunner";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  recordLength: 256,
  dateOffset: 34, // 35バイト目 (0始まり)
  deptOffset: 71, // 72バイト目 (0始まり)
  deptLength: 2,
  departmentLabels: {
    "01": "青果部",
    "03": "海産部",
    "04": "精肉部",
    "05": "デリカ部",
  } as Readonly<Record<string, string>>,
  defaultDepts: ["01", "03", "05"] as const,
  specialMonths: [2, 8] as const,
  specialDepts: ["01", "03", "04", "05"] as const,
  retryCount: 3,
  retryDelayMs: 500,
} as const;

interface DateModification {
  fileName: string;
  rowNumber: number;
  before: string;
  after: string;
}

interface MissingDepartment {
  code: string;
  name: string;
}

interface JobE27ResultData {
  inputFilePath: string;
  outputFilePath: string;
  expectedDateStr: string;
  totalRecords: number;
  modifiedDetails: DateModification[];
  missingDepartments: MissingDepartment[];
}

/**
- ドロップされた STR_DSP ファイルをデスクトップへ出力し、
- 256バイト単位の固定長レコード検証・日付修正（yymm20）・部門コード欠落チェックを実行する。
 */
export async function runJobE27(filePath?: ScriptFilePath): Promise<JobResult> {
  return runJobWithLogger("STR_DSP 処理に失敗しました", async (logger) => {
    const inputFilePath = await resolveSingleInputFile(filePath);
    const result = await processStrDspFile(inputFilePath);
    return writeResultLog(logger, result);
  });
}

async function readFileWithRetry(filePath: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fs.readFile(filePath);
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException)?.code;
      const isRetryable = code === "EBUSY" || code === "EACCES";
      if (!isRetryable || attempt >= CONFIG.retryCount) throw error;

      await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelayMs));
    }
  }
}

function stripCrLf(rawBuffer: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let start = 0;

  for (let i = 0; i < rawBuffer.length; i += 1) {
    const byte = rawBuffer[i];
    if (byte === 0x0d || byte === 0x0a) {
      if (i > start) {
        chunks.push(rawBuffer.subarray(start, i));
      }
      start = i + 1;
    }
  }

  if (start === 0) {
    return Buffer.from(rawBuffer);
  }

  if (start < rawBuffer.length) {
    chunks.push(rawBuffer.subarray(start));
  }

  return Buffer.concat(chunks);
}

function getRequiredDepts(baseDate: Date): readonly string[] {
  const month = baseDate.getMonth() + 1;
  return (CONFIG.specialMonths as readonly number[]).includes(month)
    ? CONFIG.specialDepts
    : CONFIG.defaultDepts;
}

function inspectRecord(
  record: Buffer,
  rowNumber: number,
  fileName: string,
  expectedDate: string,
  requiredDepts: readonly string[],
): { modification: DateModification | null; foundDept: string | null } {
  let modification: DateModification | null = null;
  let foundDept: string | null = null;

  if (record.length >= CONFIG.dateOffset + expectedDate.length) {
    const currentDate = record
      .subarray(CONFIG.dateOffset, CONFIG.dateOffset + expectedDate.length)
      .toString("ascii");

    if (currentDate !== expectedDate) {
      record.write(
        expectedDate,
        CONFIG.dateOffset,
        expectedDate.length,
        "ascii",
      );
      modification = {
        fileName,
        rowNumber,
        before: currentDate,
        after: expectedDate,
      };
    }
  }

  if (record.length >= CONFIG.deptOffset + CONFIG.deptLength) {
    const deptCode = record
      .subarray(CONFIG.deptOffset, CONFIG.deptOffset + CONFIG.deptLength)
      .toString("ascii");

    if (requiredDepts.includes(deptCode)) {
      foundDept = deptCode;
    }
  }

  return { modification, foundDept };
}

async function processStrDspFile(
  inputFilePath: string,
  baseDate: Date = new Date(),
): Promise<JobE27ResultData> {
  const expectedDateStr = `${format(baseDate, "yyMM")}20`;
  const requiredDepts = getRequiredDepts(baseDate);
  const fileName = path.basename(inputFilePath);
  const outputFilePath = path.join(os.homedir(), "Desktop", fileName);

  const rawBuffer = await readFileWithRetry(inputFilePath);
  const cleanBuffer = stripCrLf(rawBuffer);

  const modifiedDetails: DateModification[] = [];
  const foundDepts = new Set<string>();
  let totalRecords = 0;

  for (
    let offset = 0;
    offset < cleanBuffer.length;
    offset += CONFIG.recordLength
  ) {
    totalRecords += 1;
    const record = cleanBuffer.subarray(offset, offset + CONFIG.recordLength);
    const { modification, foundDept } = inspectRecord(
      record,
      totalRecords,
      fileName,
      expectedDateStr,
      requiredDepts,
    );

    if (modification) modifiedDetails.push(modification);
    if (foundDept) foundDepts.add(foundDept);
  }

  await fs.remove(outputFilePath);
  await fs.writeFile(outputFilePath, cleanBuffer);

  const missingDepartments = requiredDepts
    .filter((code) => !foundDepts.has(code))
    .map((code) => ({
      code,
      name: CONFIG.departmentLabels[code] ?? code,
    }));

  return {
    inputFilePath,
    outputFilePath,
    expectedDateStr,
    totalRecords,
    modifiedDetails,
    missingDepartments,
  };
}

function writeResultLog(
  logger: JobLogger,
  result: JobE27ResultData,
): JobResult {
  logger.section("レコード検証結果");
  logger.log(`期待日付 (35バイト目) : ${result.expectedDateStr}`);
  logger.log(`日付修正件数          : ${result.modifiedDetails.length}件`);

  for (const mod of result.modifiedDetails) {
    logger.log(
      `  [${mod.fileName} / ${mod.rowNumber}行目] "${mod.before}" -> "${mod.after}"`,
    );
  }

  if (result.missingDepartments.length > 0) {
    logger.section("未検出部門");
    for (const dept of result.missingDepartments) {
      logger.log(dept.name);
    }

    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}

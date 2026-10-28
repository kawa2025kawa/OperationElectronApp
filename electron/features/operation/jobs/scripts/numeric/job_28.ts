/**
 * electron/features/operation/jobs/scripts/numeric/job_28.ts
 */

import fs from "fs-extra";
import path from "node:path";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  readCsv,
  filterCsvRows,
  groupCsvRowsBy,
  writeCsvRows,
  type CsvRow,
  type ParsedCsv,
} from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  baseDir: "\\\\172.25.101.51\\if\\LOG\\DCMEOB1",
  targetPrefix: "ＥＯＢ特売送込エラー-",
  targetExtension: ".csv",
  encoding: "Shift_JIS",
  directories: {
    request: "対応依頼",
    ignore: "対応不要",
    completed: "対応済",
  },
  departmentNames: {
    "1": "青果部",
    "3": "海産部",
    "4": "精肉部",
    "5": "デリカ部",
    "6": "菓子部",
    "7": "食品部",
    "9": "雑貨部",
    "12": "精肉部",
    "13": "酒部",
    "14": "精肉部",
    "16": "ベーカリー",
    "17": "食品部",
    "19": "食品部",
    "21": "青果部",
    "23": "海産部",
    "24": "精肉部",
    "25": "デリカ部",
    "29": "催事",
    "30": "ジョイテック",
  } as Record<string, string>,
} as const;

type RequestGroup = {
  departmentName: string;
  originalFileName: string;
  header: string;
  rows: CsvRow[];
  seenRows: Set<string>;
};

type SourceFile = {
  filePath: string;
  hasProblemRows: boolean;
};

const getDateKey = (): string => format(new Date(), "yyyyMMdd");

function getDepartmentName(row: CsvRow): string {
  const rawCode = row.columns[1]?.trim() ?? "";
  const number = Number(rawCode);
  const code = Number.isNaN(number) ? rawCode : String(number);

  return CONFIG.departmentNames[code] ?? "不明";
}

function isProblemRow(row: CsvRow, today: string): boolean {
  const count = Number(row.columns[6]?.trim());

  return row.columns[4]?.trim() === today && !Number.isNaN(count) && count >= 1;
}

function getOriginalFileName(filePath: string, isRequestFile: boolean): string {
  const fileName = path.basename(filePath);

  if (!isRequestFile) return fileName;

  const prefixes = [
    ...new Set([...Object.values(CONFIG.departmentNames), "不明"]),
  ].sort((a, b) => b.length - a.length);

  const prefix = prefixes.find((name) => fileName.startsWith(`${name}_`));

  return prefix ? fileName.slice(prefix.length + 1) : fileName;
}

function aggregateRows(
  groups: Map<string, RequestGroup>,
  csv: ParsedCsv,
  rows: CsvRow[],
  originalFileName: string,
): void {
  for (const [departmentName, departmentRows] of groupCsvRowsBy(
    rows,
    getDepartmentName,
  )) {
    const key = JSON.stringify([departmentName, originalFileName]);
    let group = groups.get(key);

    if (!group) {
      group = {
        departmentName,
        originalFileName,
        header: csv.header,
        rows: [],
        seenRows: new Set(),
      };
      groups.set(key, group);
    }

    for (const row of departmentRows) {
      const rowKey = JSON.stringify(row.columns);
      if (group.seenRows.has(rowKey)) continue;

      group.seenRows.add(rowKey);
      group.rows.push(row);
    }
  }
}

async function findCsvFiles(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];

  const files: string[] = [];

  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === CONFIG.directories.completed ||
        entry.name === CONFIG.directories.ignore
      )
        continue;

      files.push(...(await findCsvFiles(filePath)));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.startsWith(CONFIG.targetPrefix) &&
      entry.name.endsWith(CONFIG.targetExtension)
    ) {
      files.push(filePath);
    }
  }

  return files;
}

async function writeRequestFiles(
  requestDir: string,
  groups: Map<string, RequestGroup>,
): Promise<string[]> {
  const createdFiles: string[] = [];

  for (const group of groups.values()) {
    const fileName = `${group.departmentName}_${group.originalFileName}`;

    await writeCsvRows(
      path.join(requestDir, fileName),
      group.header,
      group.rows,
      { encoding: CONFIG.encoding },
    );

    createdFiles.push(fileName);
  }

  return createdFiles;
}

export async function runJob28(): Promise<JobResult> {
  const logger = new JobLogger();
  const today = getDateKey();
  const todayDir = path.join(CONFIG.baseDir, today);
  const requestDir = path.join(todayDir, CONFIG.directories.request);
  const ignoreDir = path.join(todayDir, CONFIG.directories.ignore);
  const completedDir = path.join(todayDir, CONFIG.directories.completed);

  logger.log(`対象フォルダ : ${todayDir}`);

  try {
    if (!(await fs.pathExists(todayDir))) {
      logger.log(`当日フォルダが存在しません (${today})`);
      return {
        success: true,
        kind: "success",
        message: logger.complete("処理対象なしで終了"),
      };
    }

    const files = await findCsvFiles(todayDir);

    if (files.length === 0) {
      logger.log("検出対象の CSV ファイルはありませんでした");
      return {
        success: true,
        kind: "success",
        message: logger.complete("完了 (処理件数: 0)"),
      };
    }

    logger.log(`対象CSVファイル : ${files.length}件`);

    const requestGroups = new Map<string, RequestGroup>();
    const sourceFiles: SourceFile[] = [];
    let unknownCount = 0;

    for (const filePath of files) {
      const relative = path.relative(
        path.resolve(requestDir),
        path.resolve(filePath),
      );
      const isRequestFile =
        relative === "" ||
        (relative !== ".." &&
          !relative.startsWith(`..${path.sep}`) &&
          !path.isAbsolute(relative));

      const csv = await readCsv(filePath, CONFIG.encoding);
      const problemRows = filterCsvRows(csv.rows, (row) =>
        isProblemRow(row, today),
      );

      if (!isRequestFile) {
        sourceFiles.push({ filePath, hasProblemRows: problemRows.length > 0 });
      }

      if (problemRows.length === 0) continue;

      aggregateRows(
        requestGroups,
        csv,
        problemRows,
        getOriginalFileName(filePath, isRequestFile),
      );

      if (problemRows.some((row) => getDepartmentName(row) === "不明")) {
        unknownCount++;
      }

      logger.log(`ファイル名 : ${path.basename(filePath)}`);
    }

    const createdFiles = await writeRequestFiles(requestDir, requestGroups);
    let completedCount = 0;
    let ignoredCount = 0;

    for (const file of sourceFiles) {
      const destinationDir = file.hasProblemRows ? completedDir : ignoreDir;

      await fs.ensureDir(destinationDir);
      await fs.move(
        file.filePath,
        path.join(destinationDir, path.basename(file.filePath)),
        { overwrite: true },
      );

      completedCount += Number(file.hasProblemRows);
      ignoredCount += Number(!file.hasProblemRows);
    }

    logger.log(`対応不要（移動） : ${ignoredCount}件`);
    logger.log(`対応要（分割処理・移動完了） : ${completedCount}件`);

    if (createdFiles.length > 0) {
      logger.section("作成された対応依頼ファイル");
      createdFiles.forEach((fileName) => logger.log(fileName));
    }

    const summaries = [
      ...(createdFiles.length > 0
        ? [`対応依頼ファイル作成: ${createdFiles.length}件`]
        : []),
      ...(unknownCount > 0
        ? [`未定義の部門コードが含まれるファイル: ${unknownCount}件`]
        : []),
    ];

    return summaries.length > 0
      ? {
          success: true,
          kind: "needsAction",
          message: logger.needsAction(summaries.join("、")),
        }
      : {
          success: true,
          kind: "success",
          message: logger.complete("正常終了"),
        };
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    throw logger.fail(`システムエラーが発生しました${detail}`);
  }
}

// electron/features/operation/jobs/scripts/numeric/job_28.ts

import path from "node:path";
import fs from "fs-extra";
import { format, subDays } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  readCsv,
  filterCsvRows,
  groupCsvRowsBy,
  writeCsvRows,
  type CsvRow,
  type ParsedCsv,
} from "@electron/features/operation/jobs/scripts/helpers/csvUtils";

const CONFIG = {
  baseDir: "\\\\172.25.101.51\\if\\LOG\\DCMEOB1",
  targetPrefix: "ＥＯＢ特売送込エラー-",
  targetExtension: ".csv",
  encoding: "Shift_JIS",
  directories: {
    needAction: "要対応",
    request: "対応依頼",
    ignore: "対応不要",
    completed: "対応済",
  },

  departmentNames: {
    "1": "青果部",
    "21": "青果部",
    "3": "海産部",
    "23": "海産部",
    "4": "精肉部",
    "12": "精肉部",
    "24": "精肉部",
    "5": "デリカ部",
    "25": "デリカ部",
    "6": "菓子部",
    "7": "食品部",
  } as Record<string, string>,
} as const;

type CreateRequestCsvResult = {
  createdFiles: string[];
  hasUnknown: boolean;
};

// timeUtils の getDateKey をローカル実装
function getDateKey(date = new Date()): string {
  return format(date, "yyyyMMdd");
}

// timeUtils の formatDateTime をローカル実装
function formatDateTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

// fileUtils の findFiles をローカル実装
async function findFiles(
  dirPath: string,
  options: { prefix?: string; suffix?: string } = {},
): Promise<string[]> {
  if (!(await fs.pathExists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => {
      if (!entry.isFile()) return false;
      if (options.prefix && !entry.name.startsWith(options.prefix)) {
        return false;
      }
      if (options.suffix && !entry.name.endsWith(options.suffix)) {
        return false;
      }
      return true;
    })
    .map((entry) => path.join(dirPath, entry.name));
}

// fileUtils の getFilesInfo をローカル実装
async function getFilesInfo(
  filePaths: string[],
): Promise<{ fileName: string; filePath: string; mtime: Date }[]> {
  return Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);

      return {
        fileName: path.basename(filePath),
        filePath,
        mtime: stats.mtime,
      };
    }),
  );
}

// fileUtils の moveFile をローカル実装
async function moveFile(
  filePath: string,
  destinationDir: string,
): Promise<void> {
  await fs.ensureDir(destinationDir);

  const destinationPath = path.join(destinationDir, path.basename(filePath));

  await fs.move(filePath, destinationPath);
}

// 対象CSVファイルを取得
function getTargetCsvFiles(dir: string): Promise<string[]> {
  return findFiles(dir, {
    prefix: CONFIG.targetPrefix,
    suffix: CONFIG.targetExtension,
  });
}

// 対応対象の行か判定
function isProblemRow(row: CsvRow, today: string): boolean {
  return (
    row.columns[4]?.trim() === today && Number(row.columns[6]?.trim()) >= 1
  );
}

// 部門名を取得
function getDepartmentName(row: CsvRow): string {
  const rawCode = row.columns[1]?.trim() ?? "";
  const code = Number.isNaN(Number(rawCode))
    ? rawCode
    : String(Number(rawCode));

  return CONFIG.departmentNames[code] ?? "不明";
}

// 部門別の対応依頼CSVを作成
async function createRequestCsvs(
  filePath: string,
  parsedCsv: ParsedCsv,
  problemRows: CsvRow[],
  requestDir: string,
): Promise<CreateRequestCsvResult> {
  const groups = groupCsvRowsBy(problemRows, getDepartmentName);
  const originalFileName = path.basename(filePath);
  const createdFiles: string[] = [];

  for (const [departmentName, rows] of groups) {
    const fileName = `${departmentName}_${originalFileName}`;

    await writeCsvRows(
      path.join(requestDir, fileName),
      parsedCsv.header,
      rows,
      { encoding: CONFIG.encoding },
    );

    createdFiles.push(fileName);
  }

  return {
    createdFiles,
    hasUnknown: groups.has("不明"),
  };
}

// メイン処理
export async function runJob28(): Promise<string> {
  const today = getDateKey();
  const todayDir = path.join(CONFIG.baseDir, today);
  const logger = new JobLogger();

  logger.log(`対象フォルダ : ${todayDir}`);

  if (!(await fs.pathExists(todayDir))) {
    logger.log(`当日フォルダが存在しません (${today})`);
    return logger.complete("処理対象なしで終了");
  }

  const needActionDir = path.join(todayDir, CONFIG.directories.needAction);

  const [rootFiles, needActionFiles] = await Promise.all([
    getTargetCsvFiles(todayDir),
    getTargetCsvFiles(needActionDir),
  ]);

  const rootFileNames = new Set(rootFiles.map((file) => path.basename(file)));

  const csvFiles = [
    ...rootFiles,
    ...needActionFiles.filter(
      (file) => !rootFileNames.has(path.basename(file)),
    ),
  ];

  if (csvFiles.length === 0) {
    logger.log("検出対象の CSV ファイルはありませんでした");
    return logger.complete("完了 (処理件数: 0)");
  }

  logger.log(`対象ファイル検出 : ${csvFiles.length}件`);

  const fileInfos = await getFilesInfo(csvFiles);

  for (const info of fileInfos) {
    logger.log(`ファイル名 : ${info.fileName}`);
    logger.log(`更新日時 : ${formatDateTime(info.mtime)}`);
  }

  const requestDir = path.join(todayDir, CONFIG.directories.request);
  const ignoreDir = path.join(todayDir, CONFIG.directories.ignore);
  const completedDir = path.join(todayDir, CONFIG.directories.completed);

  const createdFiles: string[] = [];
  let unknownCount = 0;
  let ignoredCount = 0;
  let processedCount = 0;

  for (const filePath of csvFiles) {
    const parsedCsv = await readCsv(filePath, CONFIG.encoding);
    const problemRows = filterCsvRows(parsedCsv.rows, (row) =>
      isProblemRow(row, today),
    );

    if (problemRows.length === 0) {
      await moveFile(filePath, ignoreDir);
      ignoredCount++;
      continue;
    }

    const result = await createRequestCsvs(
      filePath,
      parsedCsv,
      problemRows,
      requestDir,
    );

    createdFiles.push(...result.createdFiles);

    if (result.hasUnknown) {
      unknownCount++;
    }

    await moveFile(filePath, completedDir);
    processedCount++;
  }

  logger.section("処理サマリー");
  logger.log(`対応不要（振り分け移動） : ${ignoredCount}件`);
  logger.log(`対応要（分割処理・完了） : ${processedCount}件`);

  if (createdFiles.length > 0) {
    logger.log("作成された対応依頼ファイル");

    for (const fileName of createdFiles) {
      logger.log(fileName);
    }
  }

  if (unknownCount > 0) {
    logger.log(`未定義の部門コードが含まれるファイル : ${unknownCount}件`);
  }

  const remainingFiles = await getTargetCsvFiles(needActionDir);

  if (remainingFiles.length > 0) {
    logger.log("要対応フォルダ内残存ファイル");

    const remainingInfos = await getFilesInfo(remainingFiles);

    for (const info of remainingInfos) {
      logger.log(`${info.fileName} (${formatDateTime(info.mtime)})`);
    }
  }

  return logger.complete("正常終了");
}

// electron/features/operation/jobs/scripts/numeric/job_28.ts

import path from "node:path";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  findFiles,
  getFileInfo,
  moveFile,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

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

type CsvRow = {
  columns: string[];
  line: string;
};

type ParsedCsv = {
  header: string;
  rows: CsvRow[];
};

type CreateRequestCsvResult = {
  createdFiles: string[];
  hasUnknown: boolean;
};

// 対象CSVファイルを取得
async function getTargetCsvFiles(dir: string): Promise<string[]> {
  return findFiles(dir, {
    prefix: CONFIG.targetPrefix,
    suffix: CONFIG.targetExtension,
  });
}

// CSVを読み込む
async function readCsv(filePath: string): Promise<ParsedCsv> {
  const buffer = await import("fs-extra").then((fs) => fs.readFile(filePath));
  const content = iconv.decode(buffer, CONFIG.encoding);
  const lines = content.split(/\r?\n/);

  return {
    header: lines[0] ?? "",
    rows: lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => ({
        line,
        columns: line.split(","),
      })),
  };
}

// 問題のある行か判定
function isProblemRow(row: CsvRow, today: string): boolean {
  return (
    row.columns[4]?.trim() === today && Number(row.columns[6]?.trim()) >= 1
  );
}

// 部門別の対応依頼CSVを作成
async function createRequestCsvs(
  filePath: string,
  parsedCsv: ParsedCsv,
  today: string,
  requestDir: string,
): Promise<CreateRequestCsvResult> {
  const problemRows = parsedCsv.rows.filter((row) => isProblemRow(row, today));

  if (problemRows.length === 0) {
    return { createdFiles: [], hasUnknown: false };
  }

  let hasUnknown = false;

  const departmentRows = problemRows.reduce<Record<string, CsvRow[]>>(
    (acc, row) => {
      const rawDeptCode = row.columns[1]?.trim() ?? "";
      const normalizedDeptCode = Number.isNaN(Number(rawDeptCode))
        ? rawDeptCode
        : String(Number(rawDeptCode));

      const deptName = CONFIG.departmentNames[normalizedDeptCode] ?? "不明";

      if (deptName === "不明") {
        hasUnknown = true;
      }

      (acc[deptName] ??= []).push(row);

      return acc;
    },
    {},
  );

  const originalFileName = path.basename(filePath);
  const createdFiles: string[] = [];

  for (const [deptName, deptRows] of Object.entries(departmentRows)) {
    const fileName = `${deptName}_${originalFileName}`;
    const outputPath = path.join(requestDir, fileName);

    const outputContent =
      [parsedCsv.header, ...deptRows.map((row) => row.line)].join("\r\n") +
      "\r\n";

    await import("fs-extra").then((fs) =>
      fs
        .ensureDir(requestDir)
        .then(() =>
          fs.writeFile(
            outputPath,
            iconv.encode(outputContent, CONFIG.encoding),
          ),
        ),
    );

    createdFiles.push(fileName);
  }

  return { createdFiles, hasUnknown };
}

// メイン処理
export async function runJob28(): Promise<string> {
  const today = getDateKey(new Date());
  const todayDir = path.join(CONFIG.baseDir, today);
  const logger = new JobLogger();

  logger.log(`対象フォルダ : ${todayDir}`);

  const todayDirExists = await import("fs-extra").then((fs) =>
    fs.pathExists(todayDir),
  );

  if (!todayDirExists) {
    logger.log(`当日フォルダが存在しません (${today})`);
    return logger.complete("処理対象なしで終了");
  }

  const rootFiles = await getTargetCsvFiles(todayDir);
  const needActionDir = path.join(todayDir, CONFIG.directories.needAction);
  const needActionFiles = await getTargetCsvFiles(needActionDir);

  const rootFileNames = new Set(rootFiles.map((file) => path.basename(file)));

  const uniqueNeedActionFiles = needActionFiles.filter(
    (file) => !rootFileNames.has(path.basename(file)),
  );

  const csvFiles = [...rootFiles, ...uniqueNeedActionFiles];

  if (csvFiles.length === 0) {
    logger.log("検出対象の CSV ファイルはありませんでした");
    return logger.complete("完了 (処理件数: 0)");
  }

  logger.log(`対象ファイル検出 : ${csvFiles.length}件`);

  const fileInfos = await Promise.all(
    csvFiles.map((filePath) => getFileInfo(filePath)),
  );

  for (const info of fileInfos) {
    logger.log(`ファイル名 : ${info.fileName}`);
    logger.log(
      `更新日時 : ${new Date(info.mtime).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })}`,
    );
  }

  const requestDir = path.join(todayDir, CONFIG.directories.request);
  const ignoreDir = path.join(todayDir, CONFIG.directories.ignore);
  const completedDir = path.join(todayDir, CONFIG.directories.completed);

  const allCreatedRequestFiles: string[] = [];

  let unknownCount = 0;
  let ignoredCount = 0;
  let processedCount = 0;

  for (const filePath of csvFiles) {
    const parsedCsv = await readCsv(filePath);

    const hasProblem = parsedCsv.rows.some((row) => isProblemRow(row, today));

    if (!hasProblem) {
      await moveFile(filePath, ignoreDir);
      ignoredCount++;
      continue;
    }

    const { createdFiles, hasUnknown } = await createRequestCsvs(
      filePath,
      parsedCsv,
      today,
      requestDir,
    );

    allCreatedRequestFiles.push(...createdFiles);

    if (hasUnknown) {
      unknownCount++;
    }

    await moveFile(filePath, completedDir);
    processedCount++;
  }

  logger.section("処理サマリー");
  logger.log(`対応不要（振り分け移動） : ${ignoredCount}件`);
  logger.log(`対応要（分割処理・完了） : ${processedCount}件`);

  if (allCreatedRequestFiles.length > 0) {
    logger.log("作成された対応依頼ファイル");

    for (const fileName of allCreatedRequestFiles) {
      logger.log(fileName);
    }
  }

  if (unknownCount > 0) {
    logger.log(`未定義の部門コードが含まれるファイル : ${unknownCount}件`);
  }

  const remainingNeedActionFiles = await getTargetCsvFiles(needActionDir);

  if (remainingNeedActionFiles.length > 0) {
    logger.log("要対応フォルダ内残存ファイル");

    const remainingInfos = await Promise.all(
      remainingNeedActionFiles.map((filePath) => getFileInfo(filePath)),
    );

    for (const info of remainingInfos) {
      logger.log(
        `${info.fileName} (${info.mtime.toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })})`,
      );
    }
  }

  return logger.complete("正常終了");
}

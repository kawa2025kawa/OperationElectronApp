// electron/services/operation/jobs/scripts/job_28.ts

import fs from "fs-extra";
import iconv from "iconv-lite";
import path from "path";
import { format } from "date-fns";

// 本番環境
const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMEOB1";

// テスト環境
//const BASE_DIR = "C:\\Users\\C3088091\\Desktop\\test";

const TARGET_PREFIX = "ＥＯＢ特売送込エラー-";
const TARGET_EXTENSION = ".csv";

const NEED_ACTION_DIR = "要対応";
const REQUEST_DIR = "対応依頼";
const IGNORE_DIR = "対応不要";
const COMPLETED_DIR = "対応済";

const DEPARTMENT_NAMES: Record<string, string> = {
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
};

type CsvRow = {
  columns: string[];
  line: string;
};

type ParsedCsv = {
  header: string;
  rows: CsvRow[];
};

function isTargetCsv(fileName: string): boolean {
  return (
    fileName.startsWith(TARGET_PREFIX) && fileName.endsWith(TARGET_EXTENSION)
  );
}

function getTargetCsvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isTargetCsv(entry.name))
    .map((entry) => path.join(dir, entry.name));
}

function readCsv(filePath: string): ParsedCsv {
  const buffer = fs.readFileSync(filePath);
  const content = iconv.decode(buffer, "Shift_JIS");

  const lines = content.split(/\r?\n/);

  const header = lines[0] ?? "";

  const rows = lines
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      line,
      columns: line.split(","),
    }));

  return {
    header,
    rows,
  };
}

function isProblemRow(row: CsvRow, today: string): boolean {
  // E列 = 発注日
  const orderDate = row.columns[4]?.trim();

  // G列 = 発注数量
  const orderQuantity = Number(row.columns[6]?.trim());

  return (
    orderDate === today && Number.isFinite(orderQuantity) && orderQuantity >= 1
  );
}

function getDepartmentName(row: CsvRow): string | undefined {
  // B列 = 部門コード
  const departmentCode = row.columns[1]?.trim();

  return DEPARTMENT_NAMES[departmentCode];
}

async function createRequestCsvs(
  filePath: string,
  today: string,
  requestDir: string,
): Promise<void> {
  const { header, rows } = readCsv(filePath);

  const problemRows = rows.filter((row) => isProblemRow(row, today));

  console.debug("[Job28] problem rows", {
    file: path.basename(filePath),
    count: problemRows.length,
  });

  if (problemRows.length === 0) {
    return;
  }

  const departmentRows = new Map<string, CsvRow[]>();

  for (const row of problemRows) {
    const departmentName = getDepartmentName(row);

    if (!departmentName) {
      console.debug("[Job28] unknown department", {
        departmentCode: row.columns[1]?.trim(),
      });

      continue;
    }

    const rowsForDepartment = departmentRows.get(departmentName) ?? [];

    rowsForDepartment.push(row);

    departmentRows.set(departmentName, rowsForDepartment);
  }

  if (departmentRows.size === 0) {
    console.debug("[Job28] no department rows", {
      file: path.basename(filePath),
    });

    return;
  }

  await fs.ensureDir(requestDir);

  const originalFileName = path.basename(filePath);

  for (const [departmentName, rowsForDepartment] of departmentRows) {
    const outputFileName = `${departmentName}_${originalFileName}`;
    const outputPath = path.join(requestDir, outputFileName);

    const outputLines = [header, ...rowsForDepartment.map((row) => row.line)];

    const outputContent = `${outputLines.join("\r\n")}\r\n`;

    const outputBuffer = iconv.encode(outputContent, "Shift_JIS");

    await fs.writeFile(outputPath, outputBuffer);

    console.debug("[Job28] request CSV created", {
      departmentName,
      file: outputFileName,
      rowCount: rowsForDepartment.length,
    });
  }
}

async function moveFile(filePath: string, targetDir: string): Promise<void> {
  await fs.ensureDir(targetDir);

  const targetPath = path.join(targetDir, path.basename(filePath));

  await fs.move(filePath, targetPath, {
    overwrite: true,
  });

  console.debug("[Job28] file moved", {
    file: path.basename(filePath),
    targetDir,
  });
}

async function processProblemCsv(
  filePath: string,
  today: string,
  requestDir: string,
): Promise<void> {
  console.debug("[Job28] process problem CSV", {
    file: path.basename(filePath),
  });

  await createRequestCsvs(filePath, today, requestDir);
}

export async function runJob28(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const todayDir = path.join(BASE_DIR, today);

  console.debug("[Job28] START", {
    today,
    todayDir,
  });

  // 本日日付フォルダなし → 正常終了
  if (!(await fs.pathExists(todayDir))) {
    console.debug("[Job28] today folder not found -> NORMAL");

    return "正常終了";
  }

  // 本日日付フォルダ直下の対象CSV
  const rootCsvFiles = getTargetCsvFiles(todayDir);

  // 要対応フォルダ内の対象CSV
  const needActionDir = path.join(todayDir, NEED_ACTION_DIR);
  const needActionCsvFiles = getTargetCsvFiles(needActionDir);

  const csvFiles = [...rootCsvFiles, ...needActionCsvFiles];

  console.debug("[Job28] CSV files", {
    rootCount: rootCsvFiles.length,
    needActionCount: needActionCsvFiles.length,
    total: csvFiles.length,
  });

  // CSVなし → 正常終了
  if (csvFiles.length === 0) {
    console.debug("[Job28] no target CSV -> NORMAL");

    return "正常終了";
  }

  const requestDir = path.join(todayDir, REQUEST_DIR);
  const ignoreDir = path.join(todayDir, IGNORE_DIR);
  const completedDir = path.join(todayDir, COMPLETED_DIR);

  let problemCount = 0;

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);

    console.debug("[Job28] checking CSV", {
      file: fileName,
    });

    const { rows } = readCsv(filePath);

    const hasProblem = rows.some((row) => isProblemRow(row, today));

    console.debug("[Job28] CSV result", {
      file: fileName,
      rowCount: rows.length,
      hasProblem,
    });

    if (!hasProblem) {
      // 対応不要CSV
      await moveFile(filePath, ignoreDir);

      continue;
    }

    // 要対応CSV
    await processProblemCsv(filePath, today, requestDir);

    // 対応処理後は対応済へ移動
    await moveFile(filePath, completedDir);

    problemCount++;
  }

  console.debug("[Job28] FINAL", {
    problemCount,
  });

  // 対応済へ移動したCSVが1件でもあればエラー扱い
  if (problemCount > 0) {
    throw new Error(`要対応CSVあり: ${problemCount}件`);
  }

  return "正常終了";
}

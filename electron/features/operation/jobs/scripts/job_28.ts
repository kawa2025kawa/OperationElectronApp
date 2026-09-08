// electron/features/operation/jobs/scripts/job_28.ts
import fs from "fs-extra";
import iconv from "iconv-lite";
import path from "path";
import { format } from "date-fns";

const BASE_DIR = "\\\\172.25.101.51\\if\\LOG\\DCMEOB1";
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

type CsvRow = { columns: string[]; line: string };

function getTargetCsvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        e.name.startsWith(TARGET_PREFIX) &&
        e.name.endsWith(TARGET_EXTENSION),
    )
    .map((e) => path.join(dir, e.name));
}

function readCsv(filePath: string): { header: string; rows: CsvRow[] } {
  const content = iconv.decode(fs.readFileSync(filePath), "Shift_JIS");
  const lines = content.split(/\r?\n/);
  return {
    header: lines[0] ?? "",
    rows: lines
      .slice(1)
      .filter((l) => l.trim())
      .map((line) => ({ line, columns: line.split(",") })),
  };
}

const isProblemRow = (row: CsvRow, today: string) =>
  row.columns[4]?.trim() === today && Number(row.columns[6]?.trim()) >= 1;

async function createRequestCsvs(
  filePath: string,
  today: string,
  requestDir: string,
): Promise<void> {
  const { header, rows } = readCsv(filePath);
  const problemRows = rows.filter((r) => isProblemRow(r, today));
  console.debug("[Job28] problem rows", {
    file: path.basename(filePath),
    count: problemRows.length,
  });

  if (problemRows.length === 0) return;

  // 部門ごとにグループ化 (reduce を活用)
  const departmentRows = problemRows.reduce<Record<string, CsvRow[]>>(
    (acc, row) => {
      const deptName = DEPARTMENT_NAMES[row.columns[1]?.trim()];
      if (deptName) (acc[deptName] ??= []).push(row);
      return acc;
    },
    {},
  );

  if (Object.keys(departmentRows).length === 0) return;

  await fs.ensureDir(requestDir);
  const originalFileName = path.basename(filePath);

  for (const [deptName, deptRows] of Object.entries(departmentRows)) {
    const outputPath = path.join(requestDir, `${deptName}_${originalFileName}`);
    const outputContent = `${[header, ...deptRows.map((r) => r.line)].join("\r\n")}\r\n`;
    await fs.writeFile(outputPath, iconv.encode(outputContent, "Shift_JIS"));
    console.debug("[Job28] request CSV created", {
      departmentName: deptName,
      file: path.basename(outputPath),
      rowCount: deptRows.length,
    });
  }
}

async function moveFile(filePath: string, targetDir: string): Promise<void> {
  await fs.ensureDir(targetDir);
  await fs.move(filePath, path.join(targetDir, path.basename(filePath)), {
    overwrite: true,
  });
  console.debug("[Job28] file moved", {
    file: path.basename(filePath),
    targetDir,
  });
}

export async function runJob28(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const todayDir = path.join(BASE_DIR, today);
  console.debug("[Job28] START", { today, todayDir });

  if (!(await fs.pathExists(todayDir))) return "正常終了";

  const csvFiles = [
    ...getTargetCsvFiles(todayDir),
    ...getTargetCsvFiles(path.join(todayDir, NEED_ACTION_DIR)),
  ];

  console.debug("[Job28] CSV files", { total: csvFiles.length });
  if (csvFiles.length === 0) return "正常終了";

  const requestDir = path.join(todayDir, REQUEST_DIR);
  const ignoreDir = path.join(todayDir, IGNORE_DIR);
  const completedDir = path.join(todayDir, COMPLETED_DIR);

  let problemCount = 0;

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);
    console.debug("[Job28] checking CSV", { file: fileName });

    const { rows } = readCsv(filePath);
    const hasProblem = rows.some((row) => isProblemRow(row, today));
    console.debug("[Job28] CSV result", {
      file: fileName,
      rowCount: rows.length,
      hasProblem,
    });

    if (!hasProblem) {
      await moveFile(filePath, ignoreDir);
      continue;
    }

    await createRequestCsvs(filePath, today, requestDir);
    await moveFile(filePath, completedDir);
    problemCount++;
  }

  console.debug("[Job28] FINAL", { problemCount });

  if (problemCount > 0) throw new Error(`要対応CSVあり: ${problemCount}件`);
  return "正常終了";
}

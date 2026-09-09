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
type ParsedCsv = { header: string; rows: CsvRow[] };

async function getTargetCsvFiles(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(
      (e) =>
        e.isFile() &&
        e.name.startsWith(TARGET_PREFIX) &&
        e.name.endsWith(TARGET_EXTENSION),
    )
    .map((e) => path.join(dir, e.name));
}

function readCsv(filePath: string): ParsedCsv {
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
  parsedCsv: ParsedCsv,
  today: string,
  requestDir: string,
): Promise<{ createdFiles: string[]; hasUnknown: boolean }> {
  const problemRows = parsedCsv.rows.filter((r) => isProblemRow(r, today));
  if (problemRows.length === 0) return { createdFiles: [], hasUnknown: false };

  let hasUnknown = false;

  const departmentRows = problemRows.reduce<Record<string, CsvRow[]>>(
    (acc, row) => {
      const rawDeptCode = row.columns[1]?.trim() ?? "";

      const normalizedDeptCode = isNaN(Number(rawDeptCode))
        ? rawDeptCode
        : String(Number(rawDeptCode));

      let deptName = DEPARTMENT_NAMES[normalizedDeptCode];

      if (!deptName) {
        deptName = "不明";
        hasUnknown = true;
      }

      (acc[deptName] ??= []).push(row);
      return acc;
    },
    {},
  );

  await fs.ensureDir(requestDir);
  const originalFileName = path.basename(filePath);
  const createdFiles: string[] = [];

  for (const [deptName, deptRows] of Object.entries(departmentRows)) {
    const fileName = `${deptName}_${originalFileName}`;
    const outputPath = path.join(requestDir, fileName);
    const outputContent = `${[parsedCsv.header, ...deptRows.map((r) => r.line)].join("\r\n")}\r\n`;
    await fs.writeFile(outputPath, iconv.encode(outputContent, "Shift_JIS"));
    createdFiles.push(fileName);
  }

  return { createdFiles, hasUnknown };
}

async function moveFile(filePath: string, targetDir: string): Promise<void> {
  await fs.ensureDir(targetDir);
  await fs.move(filePath, path.join(targetDir, path.basename(filePath)), {
    overwrite: true,
  });
}

export async function runJob28(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const todayDir = path.join(BASE_DIR, today);

  if (!(await fs.pathExists(todayDir))) return "";

  const rootFiles = await getTargetCsvFiles(todayDir);
  const needActionFiles = await getTargetCsvFiles(
    path.join(todayDir, NEED_ACTION_DIR),
  );

  const rootFileNames = new Set(rootFiles.map((f) => path.basename(f)));
  const uniqueNeedActionFiles = needActionFiles.filter(
    (f) => !rootFileNames.has(path.basename(f)),
  );

  const csvFiles = [...rootFiles, ...uniqueNeedActionFiles];
  if (csvFiles.length === 0) return "";

  const requestDir = path.join(todayDir, REQUEST_DIR);
  const ignoreDir = path.join(todayDir, IGNORE_DIR);
  const completedDir = path.join(todayDir, COMPLETED_DIR);

  const allCreatedRequestFiles: string[] = [];
  let unknownCount = 0;

  for (const filePath of csvFiles) {
    const parsedCsv = readCsv(filePath);
    const hasProblem = parsedCsv.rows.some((row) => isProblemRow(row, today));

    if (!hasProblem) {
      await moveFile(filePath, ignoreDir);
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
  }

  // 残っている「要対応」フォルダ内のファイル名を取得
  const remainingNeedActionFiles = await getTargetCsvFiles(
    path.join(todayDir, NEED_ACTION_DIR),
  );

  // モーダル表示用のコメント構築
  const comments: string[] = [];

  if (allCreatedRequestFiles.length > 0) {
    comments.push(
      `【対応依頼ファイル作成】\n` +
        allCreatedRequestFiles.map((f) => `・${f}`).join("\n"),
    );
  }

  if (remainingNeedActionFiles.length > 0) {
    comments.push(
      `【要対応フォルダ内ファイル】\n` +
        remainingNeedActionFiles.map((f) => `・${path.basename(f)}`).join("\n"),
    );
  }

  if (unknownCount > 0) {
    comments.push(
      `⚠️ 未定義の部門コードが含まれるファイルが ${unknownCount} 件あります。`,
    );
  }

  const finalComment = comments.join("\n\n");

  return finalComment;
}

// electron/features/operation/jobs/scripts/job_28.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

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
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const todayDir = path.join(BASE_DIR, today);
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [Job28] EOB特売送込エラー分割処理 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 対象フォルダ: ${todayDir}`);

  if (!(await fs.pathExists(todayDir))) {
    addLine(`⚠️ 当日フォルダが存在しません (${today})`);
    addLine(`--------------------------------------------------`);
    addLine(` [Job28] 処理対象なしで終了`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  const rootFiles = await getTargetCsvFiles(todayDir);
  const needActionFiles = await getTargetCsvFiles(
    path.join(todayDir, NEED_ACTION_DIR),
  );

  const rootFileNames = new Set(rootFiles.map((f) => path.basename(f)));
  const uniqueNeedActionFiles = needActionFiles.filter(
    (f) => !rootFileNames.has(path.basename(f)),
  );

  const csvFiles = [...rootFiles, ...uniqueNeedActionFiles];

  if (csvFiles.length === 0) {
    addLine(`▶ 検出対象の CSV ファイルはありませんでした。`);
    addLine(`--------------------------------------------------`);
    addLine(` [Job28] 完了 (処理件数: 0)`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  addLine(`▶ 対象ファイル検出: 計 ${csvFiles.length} 件`);
  for (const f of csvFiles) {
    const stat = await fs.stat(f);
    const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");
    addLine(`   ├ ${path.basename(f)}`);
    addLine(`   └ 更新日時: ${formattedDate}`);
  }
  addLine();

  const requestDir = path.join(todayDir, REQUEST_DIR);
  const ignoreDir = path.join(todayDir, IGNORE_DIR);
  const completedDir = path.join(todayDir, COMPLETED_DIR);

  const allCreatedRequestFiles: string[] = [];
  let unknownCount = 0;
  let ignoredCount = 0;
  let processedCount = 0;

  for (const filePath of csvFiles) {
    const parsedCsv = readCsv(filePath);
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

  // 振り分け・処理結果サマリーを出力
  addLine(`--------------------------------------------------`);
  addLine(` 📊 処理サマリー`);
  addLine(`   ├ 対応不要（振り分け移動）: ${ignoredCount} 件`);
  addLine(`   └ 対応要（分割処理・完了）: ${processedCount} 件`);
  addLine();

  if (allCreatedRequestFiles.length > 0) {
    addLine(`【作成された対応依頼ファイル】`);
    allCreatedRequestFiles.forEach((f) => addLine(` ・${f}`));
    addLine();
  }

  if (unknownCount > 0) {
    addLine(
      `⚠️ 未定義の部門コードが含まれるファイルが ${unknownCount} 件ありました。`,
    );
    addLine();
  }

  // 残っている「要対応」フォルダ内のファイル名を取得
  const remainingNeedActionFiles = await getTargetCsvFiles(
    path.join(todayDir, NEED_ACTION_DIR),
  );

  if (remainingNeedActionFiles.length > 0) {
    addLine(`【要対応フォルダ内残存ファイル】`);
    for (const f of remainingNeedActionFiles) {
      const stat = await fs.stat(f);
      addLine(
        ` ・${path.basename(f)} (${format(stat.mtime, "yyyy/MM/dd HH:mm:ss")})`,
      );
    }
    addLine();
  }

  addLine(`--------------------------------------------------`);
  addLine(` [Job28] 正常終了`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}

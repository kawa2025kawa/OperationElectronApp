// electron/services/operation/jobs/scripts/job_e5.ts
import fs from "fs-extra";
import path from "path";

const BASE_DIR = "C:\\Users\\C3088091\\Desktop\\test";
const OUTPUT_FILE1 = "TENF0140.dat";
const OUTPUT_FILE2 = "TENF0140.dmy";
const EXCLUDE_NAME = "TENF0140";

export async function runJobE5(): Promise<string> {
  await fs.ensureDir(BASE_DIR);
  const files = await fs.readdir(BASE_DIR);

  const inputFile = files.find((file) => {
    const fullPath = path.join(BASE_DIR, file);
    return fs.statSync(fullPath).isFile() && !file.includes(EXCLUDE_NAME);
  });

  if (!inputFile) throw new Error("処理対象のCSVファイルが見つかりません。");

  const text = await fs.readFile(path.join(BASE_DIR, inputFile), "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lines.length <= 1) throw new Error("CSVに有効なデータ行がありません。");

  lines.shift(); // ヘッダー削除
  const shapedRows: string[][] = [];

  for (const line of lines) {
    const row = line.split(",").map((v) => v.trim());
    if (row.length < 8) continue;

    row.splice(7, 1);
    row.splice(3, 1);
    row.splice(1, 1);
    row.splice(0, 1);

    const col1 = row.splice(1, 1)[0];
    const col2 = row.splice(1, 1)[0];

    if (col1 !== undefined) row.push(col1);
    if (col2 !== undefined) row.push(col2);

    if (row[0] && !isNaN(Number(row[0]))) row[0] = String(Number(row[0])).padStart(2, "0");
    if (row[1] && !isNaN(Number(row[1]))) row[1] = String(Number(row[1])).padStart(3, "0");

    shapedRows.push(row);
  }

  const outputText = shapedRows.map((r) => r.join(",")).join("\n") + "\n";
  await fs.writeFile(path.join(BASE_DIR, OUTPUT_FILE1), outputText);
  await fs.writeFile(path.join(BASE_DIR, OUTPUT_FILE2), outputText);

  return "CSV加工正常終了";
}

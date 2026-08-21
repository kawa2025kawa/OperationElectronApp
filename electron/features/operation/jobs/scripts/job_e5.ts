// electron/services/operation/jobs/scripts/job_e5.ts
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";

const BASE_DIR =
  "\\\\S0088210\\情報システム\\チェックリスト\\05_作業マニュアル\\仮\\作業フォルダ\\仕入原価リストデータ作成";
const INPUT_FILE_NAME = "TENF0140.csv";
const OUTPUT_FILE1 = "TENF0140.dat";
const OUTPUT_FILE2 = "TENF0140.dmy";
const ENCODING = "Windows-31J";

export async function runJobE5(): Promise<string> {
  await fs.ensureDir(BASE_DIR);
  const files = await fs.readdir(BASE_DIR);

  // 1. INPUT_FILE_NAME (TENF0140.csv) に完全一致するファイルを検索
  const inputFile = files.find((file) => file === INPUT_FILE_NAME);

  if (!inputFile) {
    throw new Error(
      `処理対象のCSVファイル (${INPUT_FILE_NAME}) が見つかりません。`,
    );
  }

  const inputFilePath = path.join(BASE_DIR, inputFile);

  // 0バイトファイルチェック
  const stat = await fs.stat(inputFilePath);
  if (stat.size === 0) {
    throw new Error(
      `処理対象のファイル (${INPUT_FILE_NAME}) が空 (0バイト) です。`,
    );
  }

  const rawBuffer = await fs.readFile(inputFilePath);
  const text = iconv.decode(rawBuffer, ENCODING);

  // 全改行コードパターンに対応して分割
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");

  if (lines.length <= 1) {
    throw new Error("CSVに有効なデータ行がありません。");
  }

  // 1行目（ヘッダー行: [REPORT_ID]=...）を削除
  lines.shift();
  const shapedRows: string[][] = [];

  for (const line of lines) {
    const cols = line.split(",").map((v) => v.trim());
    if (cols.length < 11) continue;

    // 部コード (cols[2]) -> 2桁パディング "01"
    const deptCode = !isNaN(Number(cols[2]))
      ? String(Number(cols[2])).padStart(2, "0")
      : cols[2];

    // 店舗コード (cols[6]) -> 3桁パディング "002"
    const storeCode = !isNaN(Number(cols[6]))
      ? String(Number(cols[6])).padStart(3, "0")
      : cols[6];

    const startDate = cols[4]; // 20260801
    const endDate = cols[5]; // 20260816
    const val1 = cols[8]; // 数値1
    const val2 = cols[9]; // 数値2
    const val3 = cols[10]; // 数値3

    // [部コード, 店舗コード, 数値1, 数値2, 数値3, 開始日, 終了日]
    shapedRows.push([
      deptCode,
      storeCode,
      val1,
      val2,
      val3,
      startDate,
      endDate,
    ]);
  }

  const outputText = shapedRows.map((r) => r.join(",")).join("\n") + "\n";
  const outputBuffer = iconv.encode(outputText, ENCODING);

  // TENF0140.dat と TENF0140.dmy の2つを出力
  await fs.writeFile(path.join(BASE_DIR, OUTPUT_FILE1), outputBuffer);
  await fs.writeFile(path.join(BASE_DIR, OUTPUT_FILE2), outputBuffer);

  return "CSV加工正常終了";
}

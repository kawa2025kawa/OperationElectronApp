import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format } from "date-fns";
import { PassThrough, Readable } from "stream";
import readline from "readline";

// ============================================================
// Constants & Types
// ============================================================

const FTP_CONFIG = {
  host: "172.31.1.4",
  port: 21,
  user: "fep",
  password: "fe-Ftp",
} as const;

const FTP_DIR = "/fep/chkcount";

const TARGET_VALUES = new Set([
  "24",
  "43",
  "51",
  "57",
  "59",
  "88",
  "700",
  "881",
  "882",
  "883",
]);

interface UnassignedDetail {
  code: string; // C列の値 (正規化後)
  detail: string; // D列の値
}

interface FileCheckResult {
  codeName: string;
  processedRows: number;
  unassignedItems: UnassignedDetail[];
}

// ============================================================
// Helper Functions
// ============================================================

async function processCsvStream(
  inputStream: Readable,
  codeName: string,
): Promise<FileCheckResult> {
  const rl = readline.createInterface({
    input: inputStream.pipe(iconv.decodeStream("Shift_JIS")),
    crlfDelay: Infinity,
  });

  let rowIndex = 0;
  let processedRows = 0;
  const unassignedItems: UnassignedDetail[] = [];

  for await (const line of rl) {
    rowIndex++;
    if (rowIndex === 1) continue; // ヘッダースキップ

    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    processedRows++;

    // A列: スキップ, B列: status, C列: rawCode, D列: rawDetail
    const [, status = "", rawCode = "", rawDetail = ""] = trimmedLine
      .split(",")
      .map((c) => c.trim());

    const normalizedCode = rawCode.replace(/^0+/, "");

    if (status === "未格納") {
      unassignedItems.push({
        code: normalizedCode,
        detail: rawDetail,
      });

      // NG判定チェック
      if (!TARGET_VALUES.has(normalizedCode)) {
        console.error(
          `[JobN33][${codeName}] ❌ NG検出 | 行: ${rowIndex} | Code: ${rawCode} (${normalizedCode}) | Detail: ${rawDetail}`,
        );
        throw new Error(
          `[${codeName}] 行${rowIndex} で不可値 '${rawCode}' を検出しました`,
        );
      }
    }
  }

  return {
    codeName,
    processedRows,
    unassignedItems,
  };
}

// ============================================================
// Main Job Function
// ============================================================

export async function runJobN33(): Promise<string> {
  const client = new Client();
  const today = format(new Date(), "yyyyMMdd");

  console.log(`\n==================================================`);
  console.log(` [JobN33] FTP CSVチェック開始 (日付: ${today})`);
  console.log(`==================================================`);

  const results: FileCheckResult[] = [];

  try {
    await client.access(FTP_CONFIG);
    await client.cd(FTP_DIR);
    const list = await client.list();

    const checkFile = async (codeName: string): Promise<void> => {
      const matchedFiles = list
        .filter(
          (f) =>
            f.name.includes(`_${codeName}_${today}`) && f.name.endsWith(".csv"),
        )
        .sort((a, b) => b.name.localeCompare(a.name));

      const file = matchedFiles[0];
      if (!file) {
        throw new Error(`[${codeName}] 当日CSV (${today}) が見つかりません`);
      }

      console.log(`▶ [${codeName}] 対象: ${file.name}`);

      const passThroughStream = new PassThrough();
      const downloadPromise = client.downloadTo(passThroughStream, file.name);
      const parsePromise = processCsvStream(passThroughStream, codeName);

      const [, result] = await Promise.all([downloadPromise, parsePromise]);

      results.push(result);

      console.log(
        `  └ 完了: 処理 ${result.processedRows} 行 | 未格納: ${result.unassignedItems.length} 件`,
      );
    };

    await checkFile("S330");
    await checkFile("S332");

    // 🎯 コメント表示用フォーマットの構築
    const commentBlocks: string[] = [];

    for (const res of results) {
      // "S330" -> "330" の表示用変換
      const displayCode = res.codeName.replace(/^S/, "");
      const count = res.unassignedItems.length;

      let block = `【${displayCode}】未格納、${count}件`;

      if (count > 0) {
        const itemLines = res.unassignedItems
          .map((item) => `${item.code}:${item.detail}`)
          .join("\n");
        block += `\n${itemLines}`;
      }

      commentBlocks.push(block);
    }

    const finalComment = commentBlocks.join("\n\n");

    console.log(`--------------------------------------------------`);
    console.log(` [JobN33] 完了`);
    console.log(`==================================================\n`);

    return finalComment;
  } catch (error) {
    console.error(`\n[JobN33] ❌ 処理中断:`, error);
    throw error;
  } finally {
    client.close();
  }
}

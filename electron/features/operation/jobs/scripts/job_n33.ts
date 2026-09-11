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
  code: string;
  detail: string;
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
    if (rowIndex === 1) continue;

    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    processedRows++;

    const [, status = "", rawCode = "", rawDetail = ""] = trimmedLine
      .split(",")
      .map((c) => c.trim());

    const normalizedCode = rawCode.replace(/^0+/, "");

    if (status === "未格納") {
      unassignedItems.push({ code: normalizedCode, detail: rawDetail });

      if (!TARGET_VALUES.has(normalizedCode)) {
        throw new Error(
          `[${codeName}] 行${rowIndex} で不可値 '${rawCode}' を検出しました`,
        );
      }
    }
  }

  return { codeName, processedRows, unassignedItems };
}

// ============================================================
// Main Job Function
// ============================================================
export async function runJobN33(): Promise<string> {
  const client = new Client();
  const today = format(new Date(), "yyyyMMdd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [JobN33] FTP CSVチェック開始 (日付: ${today})`);
  addLine(`==================================================`);

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
      if (!file)
        throw new Error(`[${codeName}] 当日CSV (${today}) が見つかりません`);

      addLine(`▶ [${codeName}] 対象: ${file.name}`);

      const passThroughStream = new PassThrough();
      const downloadPromise = client.downloadTo(passThroughStream, file.name);
      const parsePromise = processCsvStream(passThroughStream, codeName);

      const [, result] = await Promise.all([downloadPromise, parsePromise]);

      addLine(
        `  └ 完了: 処理 ${result.processedRows} 行 | 未格納: ${result.unassignedItems.length} 件`,
      );

      if (result.unassignedItems.length > 0) {
        addLine();
        result.unassignedItems.forEach((item) => {
          addLine(`${item.code}:${item.detail}`);
        });
      }
      addLine();
    };

    await checkFile("S330");
    await checkFile("S332");

    addLine(`--------------------------------------------------`);
    addLine(` [JobN33] 完了`);
    addLine(`==================================================`);

    return outputLines.join("\n");
  } finally {
    client.close();
  }
}

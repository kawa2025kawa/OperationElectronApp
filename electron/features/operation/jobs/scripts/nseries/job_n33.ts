import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format } from "date-fns";
import { PassThrough, type Readable } from "stream";
import readline from "readline";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const FTP_CONFIG = {
  host: "172.31.1.4",
  port: 21,
  user: "fep",
  password: "fe-Ftp",
} as const;

const FTP_DIR = "/fep/chkcount/";

/** チェック対象外とする店番 */
const EXCLUDE_STORE_CODES = new Set([
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

  try {
    for await (const line of rl) {
      rowIndex++;

      if (rowIndex === 1) continue;

      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      processedRows++;

      const [, status = "", rawCode = "", rawDetail = ""] = trimmedLine
        .split(",")
        .map((column) => column.trim());

      const normalizedCode = rawCode.replace(/^0+/, "");

      if (EXCLUDE_STORE_CODES.has(normalizedCode)) continue;

      if (status === "未格納") {
        unassignedItems.push({
          code: normalizedCode,
          detail: rawDetail,
        });
      }
    }
  } finally {
    rl.close();
  }

  return {
    codeName,
    processedRows,
    unassignedItems,
  };
}

export async function runJobN33(): Promise<string> {
  const client = new Client();
  const today = format(new Date(), "yyyyMMdd");
  const logger = new JobLogger();

  let hasUnassigned = false;

  try {
    logger.log(`FTP CSVチェック開始 (日付: ${today})`);
    logger.log(`FTP接続先 : ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
    logger.log(`FTPディレクトリ : ${FTP_DIR}`);

    await client.access(FTP_CONFIG);
    await client.cd(FTP_DIR);

    const files = await client.list();

    const checkFile = async (codeName: string): Promise<void> => {
      const matchedFiles = files
        .filter(
          (file) =>
            file.name.includes(`_${codeName}_${today}`) &&
            file.name.endsWith(".csv"),
        )
        .sort((a, b) => b.name.localeCompare(a.name));

      const file = matchedFiles[0];

      if (!file) {
        throw new Error(`[${codeName}] 当日CSV (${today}) が見つかりません`);
      }

      logger.log(`[${codeName}] 対象ファイル : ${file.name}`);

      const passThroughStream = new PassThrough();

      const downloadPromise = client.downloadTo(passThroughStream, file.name);

      const parsePromise = processCsvStream(passThroughStream, codeName);

      const [, result] = await Promise.all([downloadPromise, parsePromise]);

      logger.log(`[${codeName}] 処理行数 : ${result.processedRows}行`);
      logger.log(
        `[${codeName}] 未格納件数 : ${result.unassignedItems.length}件`,
      );

      if (result.unassignedItems.length === 0) return;

      hasUnassigned = true;
      logger.log(`[${codeName}] 未格納データ詳細`);

      for (const item of result.unassignedItems) {
        logger.log(`${item.code}:${item.detail}`);
      }
    };

    await checkFile("S330");
    await checkFile("S332");

    if (hasUnassigned) {
      throw new Error("未格納データを検出しました");
    }

    return logger.complete("完了");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw logger.fail(
      hasUnassigned ? message : `JobN33 エラー発生: ${message}`,
    );
  } finally {
    client.close();
  }
}

// electron/features/operation/jobs/scripts/nseries/job_n33.ts

import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format } from "date-fns";
import { PassThrough, type Readable } from "node:stream";
import readline from "node:readline";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const FTP_CONFIG = {
  host: "172.31.1.4",
  port: 21,
  user: "fep",
  password: "fe-Ftp",
} as const;

const FTP_DIR = "/fep/chkcount/";
const TARGET_CODES = ["S330", "S332"] as const;

const EXCLUDE_STORE_CODES = [
  "24",
  "43",
  "51",
  "57",
  "59",
  "88",
  "88*",
  "7**",
] as const;

interface UnassignedDetail {
  code: string;
  detail: string;
}

interface FileCheckResult {
  processedRows: number;
  unassignedItems: UnassignedDetail[];
}

function isExcludedStoreCode(code: string): boolean {
  return EXCLUDE_STORE_CODES.some((pattern) =>
    pattern.includes("*")
      ? code.length === pattern.length &&
        code.startsWith(pattern.slice(0, pattern.indexOf("*")))
      : code === pattern,
  );
}

function findTargetFile(
  files: Awaited<ReturnType<Client["list"]>>,
  codeName: string,
  today: string,
) {
  return files
    .filter(
      ({ name }) =>
        name.includes(`_${codeName}_${today}`) && name.endsWith(".csv"),
    )
    .sort((a, b) => b.name.localeCompare(a.name))[0];
}

async function processCsvStream(stream: Readable): Promise<FileCheckResult> {
  const reader = readline.createInterface({
    input: stream.pipe(iconv.decodeStream("Shift_JIS")),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let processedRows = 0;
  const unassignedItems: UnassignedDetail[] = [];

  try {
    for await (const line of reader) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (!line.trim()) continue;

      processedRows++;

      const [, status = "", rawCode = "", detail = ""] = line
        .trim()
        .split(",")
        .map((column) => column.trim());

      const code = rawCode.replace(/^0+/, "");

      if (status !== "未格納" || isExcludedStoreCode(code)) continue;

      unassignedItems.push({ code, detail });
    }
  } finally {
    reader.close();
  }

  return { processedRows, unassignedItems };
}

async function checkFile(
  client: Client,
  files: Awaited<ReturnType<Client["list"]>>,
  codeName: string,
  today: string,
  logger: JobLogger,
): Promise<boolean> {
  const file = findTargetFile(files, codeName, today);

  if (!file) {
    throw new Error(`[${codeName}] 当日CSV (${today}) が見つかりません`);
  }

  logger.log(`[${codeName}] 対象ファイル : ${file.name}`);

  const stream = new PassThrough();
  const parsePromise = processCsvStream(stream);

  await client.downloadTo(stream, file.name);
  const result = await parsePromise;

  logger.log(`[${codeName}] 処理行数 : ${result.processedRows}行`);
  logger.log(`[${codeName}] 未格納件数 : ${result.unassignedItems.length}件`);

  if (result.unassignedItems.length === 0) return false;

  logger.log(`[${codeName}] 未格納データ詳細`);

  for (const item of result.unassignedItems) {
    logger.log(`${item.code}:${item.detail}`);
  }

  return true;
}

export async function runJobN33(): Promise<string> {
  const client = new Client();
  const logger = new JobLogger();
  const today = format(new Date(), "yyyyMMdd");
  let hasUnassigned = false;

  try {
    logger.log(`FTP CSVチェック開始 (日付: ${today})`);
    logger.log(`FTP接続先 : ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
    logger.log(`FTPディレクトリ : ${FTP_DIR}`);

    await client.access(FTP_CONFIG);
    await client.cd(FTP_DIR);

    const files = await client.list();

    for (const codeName of TARGET_CODES) {
      hasUnassigned =
        (await checkFile(client, files, codeName, today, logger)) ||
        hasUnassigned;
    }

    if (hasUnassigned) {
      throw new Error("未格納データを検出しました");
    }

    return logger.complete("完了");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    throw logger.fail(
      hasUnassigned ? message : `JobN33 エラー発生: ${message}`,
    );
  } finally {
    client.close();
  }
}

// electron/features/operation/jobs/scripts/nseries/job_n33.ts

import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format } from "date-fns";
import { PassThrough, type Readable } from "node:stream";
import readline from "node:readline";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const TARGET_CODES = ["S330", "S332"] as const;

interface UnassignedDetail {
  code: string;
  detail: string;
}

interface TargetCodeResult {
  codeName: string;
  fileName: string | null;
  unassignedItems: UnassignedDetail[];
}

interface JobN33ResultData {
  today: string;
  results: TargetCodeResult[];
  missingCodes: string[];
  unassignedCodes: string[];
}

const CONFIG = {
  ftp: {
    host: "172.31.1.4",
    port: 21,
    user: "fep",
    password: "fe-Ftp",
  },
  ftpDir: "/fep/chkcount/",
  targetCodes: TARGET_CODES,
  excludeStoreCodes: [
    "24",
    "43",
    "51",
    "57",
    "59",
    "88",
    "88*",
    "7**",
  ] as const,
} as const;

/**
 * FEP FTPサーバー上の当日CSV（S330, S332）をストリーム走査し、未格納データの有無を検証する。
 *
 * 接続先:
 * - 172.31.1.4:21 (/fep/chkcount/)
 *
 * 業務上の要対応:
 * - 当日の対象CSVファイルが存在しない場合
 * - 除外店舗以外の未格納データが存在する場合
 *
 * システムエラー:
 * - FTP接続・フォルダ移動失敗
 * - ファイル一覧取得・ストリームダウンロード失敗
 */
export async function runJobN33(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkFtpCsvFiles();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`FTPチェック処理に失敗しました${detail}`);
  }
}

/**
 * 店コードが除外パターンに合致するか判定する。
 */
function isExcludedStoreCode(code: string): boolean {
  return CONFIG.excludeStoreCodes.some((pattern) =>
    pattern.includes("*")
      ? code.length === pattern.length &&
        code.startsWith(pattern.slice(0, pattern.indexOf("*")))
      : code === pattern,
  );
}

/**
 * FTPファイル一覧から対象コード・当日日付の最新CSVを特定する。
 */
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

/**
 * Shift_JIS CSVストリームを読み込み、未格納行を抽出する。
 */
async function processCsvStream(stream: Readable): Promise<UnassignedDetail[]> {
  const reader = readline.createInterface({
    input: stream.pipe(iconv.decodeStream("Shift_JIS")),
    crlfDelay: Infinity,
  });

  const unassignedItems: UnassignedDetail[] = [];
  let isHeader = true;

  try {
    for await (const line of reader) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      if (!line.trim()) {
        continue;
      }

      const [, status = "", rawCode = "", detail = ""] = line
        .trim()
        .split(",")
        .map((column) => column.trim());

      const code = rawCode.replace(/^0+/, "");

      if (status !== "未格納" || isExcludedStoreCode(code)) {
        continue;
      }

      unassignedItems.push({ code, detail });
    }
  } finally {
    reader.close();
  }

  return unassignedItems;
}

/**
 * FTPサーバーへ接続し、対象コードごとのCSV検証を実行する。
 */
async function checkFtpCsvFiles(): Promise<JobN33ResultData> {
  const client = new Client();
  const today = format(new Date(), "yyyyMMdd");

  try {
    await client.access(CONFIG.ftp);
    await client.cd(CONFIG.ftpDir);

    const files = await client.list();
    const results: TargetCodeResult[] = [];
    const missingCodes: string[] = [];
    const unassignedCodes: string[] = [];

    for (const codeName of CONFIG.targetCodes) {
      const targetFile = findTargetFile(files, codeName, today);

      if (!targetFile) {
        missingCodes.push(codeName);
        results.push({
          codeName,
          fileName: null,
          unassignedItems: [],
        });
        continue;
      }

      const stream = new PassThrough();
      const parsePromise = processCsvStream(stream);

      const [, unassignedItems] = await Promise.all([
        client.downloadTo(stream, targetFile.name),
        parsePromise,
      ]);

      if (unassignedItems.length > 0) {
        unassignedCodes.push(codeName);
      }

      results.push({
        codeName,
        fileName: targetFile.name,
        unassignedItems,
      });
    }

    return {
      today,
      results,
      missingCodes,
      unassignedCodes,
    };
  } finally {
    client.close();
  }
}

/**
 * 検証結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobN33ResultData): string {
  logger.section("FTP接続情報");
  logger.log(`接続先        : ${CONFIG.ftp.host}:${CONFIG.ftp.port}`);
  logger.log(`フォルダ  : ${CONFIG.ftpDir}`);
  logger.log(`対象日付      : ${result.today}`);

  logger.section("チェック結果");
  for (const item of result.results) {
    if (!item.fileName) {
      logger.log(`[${item.codeName}] 当日CSV (${result.today}) なし`);
      continue;
    }

    logger.log(
      `[${item.codeName}] ファイル: ${item.fileName} / 未格納: ${item.unassignedItems.length}件`,
    );

    if (item.unassignedItems.length > 0) {
      for (const unassigned of item.unassignedItems) {
        logger.log(`  - ${unassigned.code}:${unassigned.detail}`);
      }
    }
  }

  if (result.missingCodes.length > 0 || result.unassignedCodes.length > 0) {
    const actionItems: string[] = [];

    if (result.missingCodes.length > 0) {
      actionItems.push(`当日CSVなし: ${result.missingCodes.join(", ")}`);
    }

    if (result.unassignedCodes.length > 0) {
      actionItems.push(
        `未格納データあり: ${result.unassignedCodes.join(", ")}`,
      );
    }

    return logger.needsAction(`要対応項目あり (${actionItems.join("; ")})`);
  }

  return logger.complete();
}

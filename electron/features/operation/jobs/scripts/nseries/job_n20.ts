import fs from "fs-extra";
import path from "node:path";
import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const DOWNLOAD_DIR =
  process.env.OPERATION_DOWNLOAD_DIR ??
  path.join(process.env.USERPROFILE ?? "", "Downloads");

const FTP_HOST = process.env.OPERATION_FTP_HOST ?? "172.31.1.4";
const FTP_PORT = Number(process.env.OPERATION_FTP_PORT ?? "21");
const FTP_USER = process.env.OPERATION_FTP_USER;
const FTP_PASSWORD = process.env.OPERATION_FTP_PASSWORD;
const FTP_DIRECTORY = "/chkcount/";

const KEYWORD_LIST = ["24", "43", "51", "57", "59", "88", "7*", "88*"] as const;

const isKeywordMatch = (value: string): boolean =>
  KEYWORD_LIST.some((keyword) =>
    keyword.endsWith("*")
      ? value.startsWith(keyword.slice(0, -1))
      : value === keyword,
  );

async function inspectCsvFile(filePath: string): Promise<void> {
  const buffer = await fs.readFile(filePath);
  const lines = iconv.decode(buffer, "Shift_JIS").split(/\r?\n/).slice(1);

  const errorDetails = lines.flatMap((line, index) => {
    if (!line.trim()) return [];

    const columns = line
      .trim()
      .split(",")
      .map((column) => column.trim().replace(/^"|"$/g, ""));

    const colA = columns[0];
    const colC = columns[2];

    if (colA?.toUpperCase() === "NG" && colC && isKeywordMatch(colC)) {
      return [`行 ${index + 2}: A='${colA}', C='${colC}'`];
    }

    return [];
  });

  if (errorDetails.length > 0) {
    throw new Error(
      `CSVエラー [${path.basename(filePath)}]: NG対象検出:\n${errorDetails.join("\n")}`,
    );
  }
}

function validateFtpConfig(): void {
  if (!FTP_USER || !FTP_PASSWORD) {
    throw new Error(
      "FTP認証情報が設定されていません。OPERATION_FTP_USER / OPERATION_FTP_PASSWORD を設定してください。",
    );
  }

  if (!Number.isInteger(FTP_PORT) || FTP_PORT < 1 || FTP_PORT > 65535) {
    throw new Error(`FTPポート番号が不正です: ${FTP_PORT}`);
  }
}

export async function runJobN20(): Promise<string> {
  const logger = new JobLogger();

  try {
    validateFtpConfig();
    await fs.ensureDir(DOWNLOAD_DIR);

    logger.log(`FTP接続先 : ${FTP_HOST}:${FTP_PORT}`);
    logger.log(`FTPディレクトリ : ${FTP_DIRECTORY}`);
    logger.log(`ダウンロード先 : ${DOWNLOAD_DIR}`);

    const client = new Client();
    const downloadedFiles: string[] = [];

    try {
      await client.access({
        host: FTP_HOST,
        port: FTP_PORT,
        user: FTP_USER!,
        password: FTP_PASSWORD!,
      });

      await client.cd(FTP_DIRECTORY);

      const targets = (await client.list()).filter((item) => {
        const name = item.name.toLowerCase();

        return (
          name.endsWith(".csv") &&
          (item.name.includes("S330") || item.name.includes("S332"))
        );
      });

      logger.log(`ダウンロード対象 : ${targets.length}件`);

      for (const item of targets) {
        const localPath = path.join(DOWNLOAD_DIR, item.name);

        await client.downloadTo(localPath, item.name);
        downloadedFiles.push(localPath);

        logger.log(`ダウンロード完了 : ${item.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`FTP通信エラー: ${message}`);
    } finally {
      client.close();
    }

    if (downloadedFiles.length === 0) {
      logger.log("対象のCSVファイルが存在しませんでした");
      return logger.complete("対象ファイルなし");
    }

    for (const filePath of downloadedFiles) {
      logger.log(`CSV検証開始 : ${path.basename(filePath)}`);

      await inspectCsvFile(filePath);

      logger.log(`CSV検証完了 : ${path.basename(filePath)}`);
    }

    return logger.complete(`${downloadedFiles.length}ファイル確認完了`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}

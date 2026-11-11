// electron\features\operation\jobs\scripts\numeric\job_scskCheck.ts

import path from "node:path";
import fs from "fs-extra";
import { format } from "date-fns";
import { TextDecoder } from "node:util";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\192.88.2.222\\c$\\NTS\\EDIMstr\\Log",
  recordSize: 128,
  labelOffset: 8,
  labelLength: 40,
  timeOffset: 48,
  timeLength: 8,
  statusOffset: 56,
  statusLength: 40,
  encoding: "shift_jis",
} as const;

type OrderHistory = {
  orderNumber: number;
  period: "AM" | "PM";
  label: string;
  time: string;
  status: string;
  executionType: string;
};

type JobResultData = {
  targetFile: string | null;
  histories: OrderHistory[];
};

const decoder = new TextDecoder(CONFIG.encoding);

/**
 * 当日の日付に該当するCTLファイルを検索する。
 *
 * ファイル名:
 * - yyyyMMdd.ctl
 */
async function findTargetFile(): Promise<string | null> {
  const today = format(new Date(), "yyyyMMdd");
  const targetFile = path.join(CONFIG.targetDir, `${today}.ctl`);

  return (await fs.pathExists(targetFile)) ? targetFile : null;
}

/**
 * 固定長領域から文字列を取得する。
 *
 * CP932でデコードし、NULL文字と前後の空白を除去する。
 */
function readText(buffer: Buffer, offset: number, length: number): string {
  return decoder
    .decode(buffer.subarray(offset, offset + length))
    .replace(/\0/g, "")
    .trim();
}

/**
 * CTLファイルを128バイト単位で解析する。
 *
 * 各レコードから以下を取得する。
 * - 発注回数・AM/PM・送信区分
 * - 送信時刻
 * - 処理結果・実行区分
 */
function parseCtlFile(buffer: Buffer): OrderHistory[] {
  if (buffer.length === 0 || buffer.length % CONFIG.recordSize !== 0) {
    throw new Error(`CTLファイルのサイズが不正です (${buffer.length}バイト)`);
  }

  const histories: OrderHistory[] = [];

  for (let offset = 0; offset < buffer.length; offset += CONFIG.recordSize) {
    const record = buffer.subarray(offset, offset + CONFIG.recordSize);

    const label = readText(record, CONFIG.labelOffset, CONFIG.labelLength);

    if (!label) {
      continue;
    }

    const match = label.match(/^発注([１-４])回目\((AM|PM)\)送信\s*\(1\/1\)$/);

    if (!match) {
      continue;
    }

    const time = readText(record, CONFIG.timeOffset, CONFIG.timeLength);

    const statusText = readText(
      record,
      CONFIG.statusOffset,
      CONFIG.statusLength,
    );

    if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      throw new Error(`送信時刻が不正です: ${label}`);
    }

    const statusMatch = statusText.match(/^(.+?)(自動|手動)$/);

    histories.push({
      orderNumber: "１２３４".indexOf(match[1]) + 1,
      period: match[2] as "AM" | "PM",
      label,
      time,
      status: statusMatch?.[1] ?? statusText,
      executionType: statusMatch?.[2] ?? "",
    });
  }

  return histories.sort((a, b) => a.orderNumber - b.orderNumber);
}

/**
 * 当日分のCTLファイルを読み込み、発注履歴を取得する。
 */
async function getOrderHistory(): Promise<JobResultData> {
  const targetFile = await findTargetFile();

  if (targetFile === null) {
    return {
      targetFile: null,
      histories: [],
    };
  }

  const buffer = await fs.readFile(targetFile);
  const histories = parseCtlFile(buffer);

  return {
    targetFile,
    histories,
  };
}

/**
 * 取得した発注履歴をログに出力する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  if (result.targetFile === null) {
    logger.log("当日分のCTLファイルなし");
    return logger.complete();
  }

  logger.section("対象ファイル");
  logger.log(result.targetFile);

  if (result.histories.length === 0) {
    logger.log("発注履歴なし");
    return logger.complete();
  }

  logger.section("発注履歴");

  for (const history of result.histories) {
    logger.log(
      `${history.label} ${history.time} ${history.status} ${history.executionType}`,
    );
  }

  return logger.complete();
}

/**
 * ジョブ実行入口。
 */
export async function runJobScskCheck(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await getOrderHistory();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`CTLファイルの解析に失敗しました${detail}`);
  }
}

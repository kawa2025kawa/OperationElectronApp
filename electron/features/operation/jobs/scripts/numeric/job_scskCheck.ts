// electron/features/operation/jobs/scripts/numeric/job_scskCheck.ts

import path from "node:path";
import fs from "fs-extra";
import { format } from "date-fns";
import { TextDecoder } from "node:util";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { runJobWithLogger } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";

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

const KANRI_NO_TO_ORDER_NUMBER: Readonly<Record<string, number>> = {
  "301": 1,
  "371": 2,
  "451": 3,
  "481": 4,
};

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

function resolveTargetOrderNumber(kanriNo?: string): number | undefined {
  if (!kanriNo) return undefined;
  return KANRI_NO_TO_ORDER_NUMBER[normalizeKanriNo(kanriNo)];
}

async function findTargetFile(): Promise<string | null> {
  const today = format(new Date(), "yyyyMMdd");
  const targetFile = path.join(CONFIG.targetDir, `${today}.ctl`);

  return (await fs.pathExists(targetFile)) ? targetFile : null;
}

function readText(buffer: Buffer, offset: number, length: number): string {
  return decoder
    .decode(buffer.subarray(offset, offset + length))
    .replace(/\0/g, "")
    .trim();
}

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

function formatHistoryLine(history: OrderHistory): string {
  return [
    history.label,
    history.time,
    history.status,
    history.executionType,
  ]
    .filter(Boolean)
    .join(" ");
}

function evaluateResult(
  logger: JobLogger,
  result: JobResultData,
  targetOrderNumber?: number,
): JobResult {
  const targetLabel =
    targetOrderNumber !== undefined
      ? `No.${targetOrderNumber}発注（${targetOrderNumber}回目送信）`
      : undefined;

  if (result.targetFile === null) {
    logger.log("当日分のCTLファイルなし");
    const reason = targetLabel
      ? `当日分のCTLファイルが存在しません（対象: ${targetLabel}）`
      : "当日分のCTLファイルが存在しません";

    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(reason),
    };
  }

  logger.section("対象ファイル");
  logger.log(result.targetFile);

  if (result.histories.length === 0) {
    logger.log("発注履歴なし");
  } else {
    logger.section("発注履歴（当日分）");
    for (const history of result.histories) {
      logger.log(formatHistoryLine(history));
    }
  }

  if (targetOrderNumber !== undefined) {
    const matched = result.histories.find(
      (history) => history.orderNumber === targetOrderNumber,
    );

    if (!matched) {
      return {
        success: true,
        kind: "needsAction",
        message: logger.needsAction(
          `${targetLabel}の送信履歴が見つかりません`,
        ),
      };
    }

    return {
      success: true,
      kind: "success",
      message: logger.complete(`確認完了: ${formatHistoryLine(matched)}`),
    };
  }

  if (result.histories.length === 0) {
    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction("発注送信履歴が見つかりません"),
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete("確認完了"),
  };
}

export async function runJobScskCheck(kanriNo?: string): Promise<JobResult> {
  return runJobWithLogger(
    "CTLファイルの解析に失敗しました",
    async (logger) => {
      const targetOrderNumber = resolveTargetOrderNumber(kanriNo);
      const result = await getOrderHistory();
      return evaluateResult(logger, result, targetOrderNumber);
    },
  );
}
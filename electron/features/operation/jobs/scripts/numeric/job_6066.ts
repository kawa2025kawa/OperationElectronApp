// electron/features/operation/jobs/scripts/numeric/job_6066.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  apiUrl: "http://onpremises-web-server.belc.internal:8088/request",
  sql: "SELECT *FROM mtn_haita_seigyo WHERE MSTKBN='ADMIN'",
} as const;

interface HaitaRecord {
  SYOHINCD?: string;
  MTN_USERNAME?: string;
  MTN_DATE?: string;
  MTN_TIME?: string;
}

interface ApiResponse {
  status?: string;
  datas?: HaitaRecord[];
}

function parseApiResponse(raw: unknown): ApiResponse | null {
  const data = Array.isArray(raw) ? raw[0] : raw;

  if (!data || typeof data !== "object") {
    return null;
  }

  return data as ApiResponse;
}

function formatDate(value: string): string {
  if (value.length !== 8) {
    return value;
  }

  return `${value.slice(0, 4)}/${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

function formatTime(value: string): string {
  if (value.length !== 6) {
    return value;
  }

  return `${value.slice(0, 2)}:${value.slice(2, 4)}:${value.slice(4, 6)}`;
}

function isValidRecord(
  record: HaitaRecord | undefined,
): record is HaitaRecord & {
  SYOHINCD: string;
  MTN_USERNAME: string;
  MTN_DATE: string;
  MTN_TIME: string;
} {
  return Boolean(
    record?.SYOHINCD &&
    record.MTN_USERNAME &&
    record.MTN_DATE &&
    record.MTN_TIME,
  );
}

export async function runJob6066(): Promise<string> {
  const logger = new JobLogger();

  let raw: unknown;

  try {
    const response = await fetch(
      `${CONFIG.apiUrl}?SQL=${encodeURIComponent(CONFIG.sql)}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP エラー: ${response.status}`);
    }

    raw = await response.json();
  } catch {
    logger.log("API リクエスト失敗");
    throw logger.fail("API 接続エラー");
  }

  const apiData = parseApiResponse(raw);
  const record = apiData?.status === "0" ? apiData.datas?.[0] : undefined;

  if (!isValidRecord(record)) {
    logger.log("排他制御レコードの取得に失敗しました");
    throw logger.fail("レコード取得失敗");
  }

  const updatedAt = `${formatDate(record.MTN_DATE)} ${formatTime(record.MTN_TIME)}`;

  logger.log(`  状態            : ${record.SYOHINCD}`);
  logger.log(`  更新者          : ${record.MTN_USERNAME}`);
  logger.log(`  更新日時        : ${updatedAt}`);

  return logger.complete();
}

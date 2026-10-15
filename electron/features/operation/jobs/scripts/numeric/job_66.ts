// electron/features/operation/jobs/scripts/numeric/job_66.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const API_URL = "http://onpremises-web-server.belc.internal:8088/request";
const SQL = "SELECT *FROM mtn_haita_seigyo WHERE MSTKBN='ADMIN'";

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

export async function runJob66(): Promise<string> {
  const logger = new JobLogger();

  logger.log(`API URL : ${API_URL}`);

  const response = await fetch(
    `${API_URL}?SQL=${encodeURIComponent(SQL)}`,
  ).catch(() => null);

  if (!response?.ok) {
    logger.log("API リクエスト失敗");
    throw logger.fail("API 接続エラー");
  }

  const raw: unknown = await response.json().catch(() => null);
  const data = Array.isArray(raw) ? raw[0] : raw;

  const apiData =
    data && typeof data === "object" ? (data as ApiResponse) : null;

  const record = apiData?.status === "0" ? apiData.datas?.[0] : null;

  if (
    !record?.SYOHINCD ||
    !record.MTN_USERNAME ||
    !record.MTN_DATE ||
    !record.MTN_TIME
  ) {
    logger.log("排他制御レコードの取得に失敗しました");
    throw logger.fail("レコード取得失敗");
  }

  const {
    SYOHINCD,
    MTN_USERNAME,
    MTN_DATE: dateValue,
    MTN_TIME: timeValue,
  } = record;

  const date =
    dateValue.length === 8
      ? `${dateValue.slice(0, 4)}/${dateValue.slice(4, 6)}/${dateValue.slice(6, 8)}`
      : dateValue;

  const time =
    timeValue.length === 6
      ? `${timeValue.slice(0, 2)}:${timeValue.slice(2, 4)}:${timeValue.slice(4, 6)}`
      : timeValue;

  const updatedAt = `${date} ${time}`;

  logger.log("排他制御状態 :");
  logger.log(`  状態 (SYOHINCD) : ${SYOHINCD}`);
  logger.log(`  更新者          : ${MTN_USERNAME}`);
  logger.log(`  更新日時        : ${updatedAt}`);

  if (SYOHINCD === "UNLOCK") {
    return logger.complete("ロック解除 (UNLOCK)");
  }

  if (SYOHINCD === "LOCK") {
    return logger.complete("ロック中 (LOCK)");
  }

  logger.log(`想定外のステータス (${SYOHINCD})`);
  throw logger.fail(`不正な SYOHINCD : ${SYOHINCD}`);
}

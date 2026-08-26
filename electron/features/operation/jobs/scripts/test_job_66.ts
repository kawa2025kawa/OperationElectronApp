// electron/features/operation/jobs/scripts/test_job_66.ts

const API_URL = "http://onpremises-web-server.belc.internal:8088/request";
const SQL = "SELECT *FROM mtn_haita_seigyo WHERE MSTKBN='ADMIN'";

interface HaitaControlRecord {
  SYOHINCD?: string;
  MTN_USERNAME?: string;
  MTN_DATE?: string;
  MTN_TIME?: string;
}

interface HaitaControlResponse {
  status?: string;
  msg?: string;
  datas?: HaitaControlRecord[];
}

export async function runJob66Test(): Promise<string> {
  const requestUrl = `${API_URL}?SQL=${encodeURIComponent(SQL)}`;

  let response: Response;

  try {
    response = await fetch(requestUrl);
  } catch {
    throw new Error("排他制御情報の取得に失敗しました。");
  }

  if (!response.ok) {
    throw new Error(
      `排他制御情報の取得に失敗しました。HTTP Status: ${response.status}`,
    );
  }

  let rawData: unknown;

  try {
    rawData = await response.json();
  } catch {
    throw new Error("排他制御情報のレスポンス解析に失敗しました。");
  }

  // ★ レスポンスが配列 ([{ status: "0", datas: [...] }]) で返ってくる問題に対応
  const data: HaitaControlResponse | undefined = Array.isArray(rawData)
    ? (rawData[0] as HaitaControlResponse)
    : (rawData as HaitaControlResponse);

  if (!data || data.status !== "0" || !Array.isArray(data.datas)) {
    throw new Error("排他制御情報を取得できませんでした。");
  }

  const record = data.datas[0];

  if (!record) {
    throw new Error("排他制御情報が存在しません。");
  }

  const { SYOHINCD, MTN_USERNAME, MTN_DATE, MTN_TIME } = record;

  if (!SYOHINCD) {
    throw new Error("排他制御情報にSYOHINCDが存在しません。");
  }

  if (!MTN_USERNAME || !MTN_DATE || !MTN_TIME) {
    throw new Error("排他制御情報の更新者・更新日時が取得できません。");
  }

  const formattedDate =
    MTN_DATE.length === 8
      ? `${MTN_DATE.slice(0, 4)}/${MTN_DATE.slice(4, 6)}/${MTN_DATE.slice(6, 8)}`
      : MTN_DATE;

  const formattedTime =
    MTN_TIME.length === 6
      ? `${MTN_TIME.slice(0, 2)}:${MTN_TIME.slice(2, 4)}:${MTN_TIME.slice(4, 6)}`
      : MTN_TIME;

  const updatedAt = `${formattedDate} ${formattedTime}`;

  if (SYOHINCD === "UNLOCK") {
    return `ロック解除済み（解除者：${MTN_USERNAME}、日時：${updatedAt}）`;
  }

  if (SYOHINCD === "LOCK") {
    return `ロック中（ロック者：${MTN_USERNAME}、日時：${updatedAt}）`;
  }

  throw new Error(`排他制御情報のSYOHINCDが不正です: ${SYOHINCD}`);
}

// ターミナル直接実行用
async function main() {
  try {
    const result = await runJob66Test();
    console.log("\n【実行成功】");
    console.log(result);
  } catch (error) {
    console.error("\n【実行失敗】");
    console.error(error instanceof Error ? error.message : error);
  }
}

main();

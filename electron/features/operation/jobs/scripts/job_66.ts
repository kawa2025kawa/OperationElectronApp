// electron/features/operation/jobs/scripts/job_66.ts

const API_URL = "http://onpremises-web-server.belc.internal:8088/request";
const SQL = "SELECT *FROM mtn_haita_seigyo WHERE MSTKBN='ADMIN'";

export async function runJob66(): Promise<string> {
  const res = await fetch(`${API_URL}?SQL=${encodeURIComponent(SQL)}`).catch(
    () => null,
  );
  if (!res?.ok) throw new Error("排他制御情報の取得に失敗しました。");

  const raw = await res.json().catch(() => null);
  const data = Array.isArray(raw) ? raw[0] : raw;
  const record = data?.status === "0" ? data?.datas?.[0] : null;

  if (
    !record?.SYOHINCD ||
    !record.MTN_USERNAME ||
    !record.MTN_DATE ||
    !record.MTN_TIME
  ) {
    throw new Error("排他制御情報を取得できませんでした。");
  }

  const { SYOHINCD, MTN_USERNAME, MTN_DATE: d, MTN_TIME: t } = record;
  const date =
    d.length === 8 ? `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)}` : d;
  const time =
    t.length === 6 ? `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}` : t;
  const updatedAt = `${date} ${time}`;

  if (SYOHINCD === "UNLOCK")
    return `ロック解除済み（解除者：${MTN_USERNAME}、日時：${updatedAt}）`;
  if (SYOHINCD === "LOCK")
    return `ロック中（ロック者：${MTN_USERNAME}、日時：${updatedAt}）`;

  throw new Error(`排他制御情報のSYOHINCDが不正です: ${SYOHINCD}`);
}

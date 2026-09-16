// electron/features/operation/jobs/scripts/job_66.ts
import { format } from "date-fns";

const API_URL = "http://onpremises-web-server.belc.internal:8088/request";
const SQL = "SELECT *FROM mtn_haita_seigyo WHERE MSTKBN='ADMIN'";

export async function runJob66(): Promise<string> {
  const now = new Date();
  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(
    ` [Job66] 排他制御情報確認 (確認日時: ${format(now, "yyyy/MM/dd HH:mm:ss")})`,
  );
  addLine(`==================================================`);
  addLine(`▶ 取得API URL: ${API_URL}`);

  const res = await fetch(`${API_URL}?SQL=${encodeURIComponent(SQL)}`).catch(
    () => null,
  );

  if (!res?.ok) {
    addLine(`❌ API通信エラー: レスポンス取得失敗`);
    addLine(`--------------------------------------------------`);
    throw new Error(
      `排他制御情報の取得に失敗しました。\n\n${outputLines.join("\n")}`,
    );
  }

  const raw = await res.json().catch(() => null);
  const data = Array.isArray(raw) ? raw[0] : raw;
  const record = data?.status === "0" ? data?.datas?.[0] : null;

  if (
    !record?.SYOHINCD ||
    !record.MTN_USERNAME ||
    !record.MTN_DATE ||
    !record.MTN_TIME
  ) {
    addLine(`❌ レコードエラー: 必要なデータ構造が含まれていません`);
    addLine(`--------------------------------------------------`);
    throw new Error(
      `排他制御情報を取得できませんでした。\n\n${outputLines.join("\n")}`,
    );
  }

  const { SYOHINCD, MTN_USERNAME, MTN_DATE: d, MTN_TIME: t } = record;
  const date =
    d.length === 8 ? `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)}` : d;
  const time =
    t.length === 6 ? `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}` : t;
  const updatedAt = `${date} ${time}`;

  addLine(`▶ 取得データ詳細:`);
  addLine(`   ├ 状態コード (SYOHINCD) : ${SYOHINCD}`);
  addLine(`   ├ 操作ユーザー          : ${MTN_USERNAME}`);
  addLine(`   └ 最終更新日時          : ${updatedAt}`);
  addLine(`--------------------------------------------------`);

  if (SYOHINCD === "UNLOCK") {
    addLine(` [Job66] 正常終了 (判定: ロック解除済み)`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  if (SYOHINCD === "LOCK") {
    addLine(` [Job66] 正常終了 (判定: ロック中)`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  addLine(`❌ データ不備: 定義外のステータスコード (${SYOHINCD})`);
  addLine(`--------------------------------------------------`);
  throw new Error(
    `排他制御情報のSYOHINCDが不正です: ${SYOHINCD}\n\n${outputLines.join("\n")}`,
  );
}

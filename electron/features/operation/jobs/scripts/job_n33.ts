// electron/services/operation/jobs/scripts/job_n33.ts
import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format } from "date-fns";
import { Writable } from "stream";

const FTP_CONFIG = {
  host: "172.31.1.4",
  port: 21,
  user: "fep",
  password: "fe-Ftp",
};
const FTP_DIR = "/fep/chkcount";

// ゼロ埋めなしの対象コード一覧
const TARGET_VALUES = [
  "24",
  "43",
  "51",
  "57",
  "59",
  "88",
  "700",
  "881",
  "882",
  "883",
] as const;

export async function runJobN33(): Promise<string> {
  const client = new Client();
  const today = format(new Date(), "yyyyMMdd");

  console.log(`[JobN33] --- 処理開始 (対象日付: ${today}) ---`);

  try {
    await client.access(FTP_CONFIG);
    await client.cd(FTP_DIR);
    const list = await client.list();

    const checkFile = async (codeName: string) => {
      console.log(
        `[JobN33][${codeName}] 検索開始: パターン "_${codeName}_${today}"`,
      );

      // 当日日付の対象 CSV を取得
      const matchedFiles = list
        .filter(
          (f) =>
            f.name.includes(`_${codeName}_${today}`) && f.name.endsWith(".csv"),
        )
        .sort((a, b) => b.name.localeCompare(a.name));

      const file = matchedFiles[0];
      if (!file) {
        console.error(
          `[JobN33][${codeName}] 当日日付 (${today}) の対象CSVが見つかりません。`,
        );
        throw new Error(
          `[${codeName}] 当日日付 (${today}) の対象CSVが見つかりません`,
        );
      }

      console.log(`[JobN33][${codeName}] 読み取り対象ファイル: "${file.name}"`);

      // メモリ上で読み取り
      const chunks: Buffer[] = [];
      const writable = new Writable({
        write: (chunk, _, cb) => {
          chunks.push(chunk);
          cb();
        },
      });
      await client.downloadTo(writable, file.name);

      const lines = iconv
        .decode(Buffer.concat(chunks), "Shift_JIS")
        .split(/\r?\n/)
        .slice(1);
      console.log(
        `[JobN33][${codeName}] データ解析完了 (総行数: ${lines.length} 行)`,
      );

      let processedRows = 0;
      let unassignedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        processedRows++;

        const [, status = "", rawCode = ""] = line
          .split(",")
          .map((c) => c.trim());

        // Codeの先頭ゼロ埋めを解除 (例: "0002" -> "2", "088" -> "88")
        const normalizedCode = rawCode.replace(/^0+/, "");

        if (status === "未格納") {
          unassignedCount++;
          console.log(
            `[JobN33][${codeName}] [未格納検出] 行=${i + 2} Status=${status}, Code=${rawCode} (正規化: ${normalizedCode})`,
          );
        }

        // 「未格納」かつ「TARGET_VALUESに含まれていない」場合にエラー判定
        if (
          status === "未格納" &&
          !TARGET_VALUES.includes(
            normalizedCode as (typeof TARGET_VALUES)[number],
          )
        ) {
          console.error(
            `[JobN33][${codeName}] [NG判定] エラー検出 行=${i + 2} Status=${status}, Code=${rawCode} (正規化: ${normalizedCode})`,
          );
          throw new Error(
            `[${codeName}] エラー行=${i + 2} Status=${status}, Code=${rawCode} (正規化: ${normalizedCode})`,
          );
        }
      }

      console.log(
        `[JobN33][${codeName}] チェックパス: 有効行=${processedRows}件, 未格納=${unassignedCount}件 (すべて許可値内)`,
      );
    };

    await checkFile("S330");
    await checkFile("S332");

    console.log("[JobN33] --- S330 / S332 全体の検証が正常終了しました ---");
    return "FTP CSVチェック正常終了";
  } catch (error) {
    console.error("[JobN33] 処理中に例外が発生しました:", error);
    throw error;
  } finally {
    client.close();
  }
}

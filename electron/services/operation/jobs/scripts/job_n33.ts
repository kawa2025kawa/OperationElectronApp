// electron/services/operation/jobs/scripts/job_n33.ts
import { Client } from "basic-ftp";
import iconv from "iconv-lite";
import { format, addDays } from "date-fns";
import { Writable } from "stream";

const FTP_HOST = "172.31.1.4";
const FTP_PORT = 21;
const FTP_USER = "fep";
const FTP_PASS = "fe-Ftp";
const FTP_DIR = "/fep/chkcount";

const TARGET_VALUES = ["24", "43", "51", "57", "59", "88", "700", "881", "882", "883"] as const;

export async function runJobN33(): Promise<string> {
  const client = new Client();
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  try {
    await client.access({ host: FTP_HOST, port: FTP_PORT, user: FTP_USER, password: FTP_PASS });
    await client.cd(FTP_DIR);
    const list = await client.list();

    const fetchAndCheck = async (keyword: string, label: string): Promise<void> => {
      const file = list.find((f) => f.name.includes(keyword) && f.name.toLowerCase().endsWith(".csv"));
      if (!file) throw new Error(`[${label}] CSVが見つかりません`);

      const fileDate = format(file.modifiedAt ?? new Date(), "yyyy-MM-dd");
      if (fileDate !== tomorrow) throw new Error(`[${label}] 日付不一致 期待値=${tomorrow}, 実測値=${fileDate}`);

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const writable = new Writable({
          write(chunk: Buffer, _enc: string, cb: () => void) {
            chunks.push(chunk);
            cb();
          },
        });
        writable.on("finish", () => resolve(Buffer.concat(chunks)));
        writable.on("error", reject);
        client.downloadTo(writable, file.name);
      });

      const text = iconv.decode(buffer, "Shift_JIS");
      const lines = text.split(/\r?\n/).slice(1);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        const cols = line.split(",").map((c) => c.trim());
        const status = cols[1] ?? "";
        const code = cols[2] ?? "";

        if (status !== "処理済" && !TARGET_VALUES.includes(code as any)) {
          throw new Error(`[${label}] エラー行=${i + 2} Status=${status}, Code=${code}`);
        }
      }
    };

    await fetchAndCheck("FEP_S330", "S330");
    await fetchAndCheck("FEP_S332", "S332");

    return "FTP CSVチェック正常終了";
  } finally {
    client.close();
  }
}

// electron/services/operation/jobs/scripts/job_n20.ts
import fs from "fs-extra";
import path from "path";
import { Client } from "basic-ftp";
import iconv from "iconv-lite";

const DOWNLOAD_DIR = "C:\\Users\\C3088091\\Downloads";
const KEYWORD_LIST = ["24", "43", "51", "57", "59", "88", "7*", "88*"] as const;

function isKeywordMatch(val: string): boolean {
  return KEYWORD_LIST.some((kw) => {
    if (kw.endsWith("*")) return val.startsWith(kw.slice(0, -1));
    return val === kw;
  });
}

export async function runJobN20(): Promise<string> {
  await fs.ensureDir(DOWNLOAD_DIR);
  const client = new Client();
  const downloadedFiles: string[] = [];

  try {
    await client.access({ host: "172.31.1.4", port: 21, user: "fep", password: "fe-Ftp" });
    await client.cd("/chkcount/");
    const list = await client.list();

    for (const item of list) {
      const isTarget = item.name.toLowerCase().endsWith(".csv") && (item.name.includes("S330") || item.name.includes("S332"));
      if (!isTarget) continue;

      const localPath = path.join(DOWNLOAD_DIR, item.name);
      await client.downloadTo(localPath, item.name);
      downloadedFiles.push(localPath);
    }
  } finally {
    client.close();
  }

  if (downloadedFiles.length === 0) return "対象のCSVファイルが存在しませんでした";

  for (const filePath of downloadedFiles) {
    const buffer = await fs.readFile(filePath);
    const text = iconv.decode(buffer, "Shift_JIS");
    const lines = text.split(/\r?\n/).slice(1);
    const errorDetails: string[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const cols = trimmed.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const colA = cols[0];
      const colC = cols[2];

      if (colA?.toUpperCase() === "NG" && colC && isKeywordMatch(colC)) {
        errorDetails.push(`行 ${idx + 2}: A='${colA}', C='${colC}'`);
      }
    });

    if (errorDetails.length > 0) {
      throw new Error(`CSVエラー [${path.basename(filePath)}]: NG対象検出:\n${errorDetails.join("\n")}`);
    }
  }
  return `完了 (${downloadedFiles.length}ファイル確認)`;
}

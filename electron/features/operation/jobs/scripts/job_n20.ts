// electron/features/operation/jobs/scripts/job_n20.ts
import fs from "fs-extra";
import path from "path";
import { Client } from "basic-ftp";
import iconv from "iconv-lite";

const DOWNLOAD_DIR = "C:\\Users\\C3088091\\Downloads";
const KEYWORD_LIST = ["24", "43", "51", "57", "59", "88", "7*", "88*"] as const;

const isKeywordMatch = (val: string) =>
  KEYWORD_LIST.some((kw) =>
    kw.endsWith("*") ? val.startsWith(kw.slice(0, -1)) : val === kw,
  );

async function inspectCsvFile(filePath: string): Promise<void> {
  const buffer = await fs.readFile(filePath);
  const lines = iconv.decode(buffer, "Shift_JIS").split(/\r?\n/).slice(1);

  const errorDetails = lines.flatMap((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return [];

    const cols = trimmed.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [colA, , colC] = [cols[0], cols[1], cols[2]];

    if (colA?.toUpperCase() === "NG" && colC && isKeywordMatch(colC)) {
      return [`行 ${idx + 2}: A='${colA}', C='${colC}'`];
    }
    return [];
  });

  if (errorDetails.length > 0) {
    throw new Error(
      `CSVエラー [${path.basename(filePath)}]: NG対象検出:\n${errorDetails.join("\n")}`,
    );
  }
}

export async function runJobN20(): Promise<string> {
  await fs.ensureDir(DOWNLOAD_DIR);
  const client = new Client();
  const downloadedFiles: string[] = [];

  try {
    await client.access({
      host: "172.31.1.4",
      port: 21,
      user: "fep",
      password: "fe-Ftp",
    });
    await client.cd("/chkcount/");

    const targets = (await client.list()).filter((item) => {
      const name = item.name.toLowerCase();
      return (
        name.endsWith(".csv") &&
        (item.name.includes("S330") || item.name.includes("S332"))
      );
    });

    for (const item of targets) {
      const localPath = path.join(DOWNLOAD_DIR, item.name);
      await client.downloadTo(localPath, item.name);
      downloadedFiles.push(localPath);
    }
  } finally {
    client.close();
  }

  if (downloadedFiles.length === 0)
    return "対象のCSVファイルが存在しませんでした";

  for (const filePath of downloadedFiles) {
    await inspectCsvFile(filePath);
  }

  return `完了 (${downloadedFiles.length}ファイル確認)`;
}

// electron/features/operation/jobs/scripts/job_n12.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const UNPROCESSED_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";
const COMPLETED_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV\\SV";

const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export interface JobN12Options {
  dsi8020Status?: string | null;
  [key: string]: unknown;
}

export async function runJobN12(options?: JobN12Options): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [JobN12] ファイル存在チェック開始 (日付: ${today})`);
  addLine(`==================================================`);

  // DSI8020 のステータス判定
  const dsi8020Status = options?.dsi8020Status ?? "予定";
  const normalizedStatus = String(dsi8020Status).toUpperCase();

  addLine(`▶ DSI8020 Status : ${dsi8020Status}`);

  // 🎯【追加】DSI8020 がエラーの場合は処理不可メッセージを出力して早期リターン
  if (dsi8020Status === "エラー" || normalizedStatus === "ERROR") {
    addLine(
      `⚠️ 前提ジョブ (DSI8020) がエラー状態のため、本処理は実行不可です。`,
    );
    addLine(`--------------------------------------------------`);
    addLine(` [JobN12] 処理中断`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  // 「予定」または「待合」の場合は RCV、それ以外はすべて SV を参照
  const isUnprocessed =
    dsi8020Status === "予定" ||
    dsi8020Status === "待合" ||
    normalizedStatus === "SCHEDULED" ||
    normalizedStatus === "WAITING";

  const targetDir = isUnprocessed ? UNPROCESSED_DIR : COMPLETED_DIR;

  addLine(`▶ 参照フォルダ   : ${targetDir}`);
  addLine();

  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`ディレクトリが存在しません: ${targetDir}`);
  }

  const files = await fs.readdir(targetDir);
  const missing: string[] = [];

  if (isUnprocessed) {
    /* ------------------------------------------------------------
     *  Status === "予定" | "待合" 時のロジック (RCVフォルダ確認)
     * ------------------------------------------------------------ */
    addLine(`【判定モード: 未処理ファイル確認 (RCV)】`);

    for (const kw of KEYWORDS) {
      const matchedFiles = files.filter((f) => f.includes(kw));

      if (matchedFiles.length === 0) {
        missing.push(kw);
        addLine(`❌ [${kw}] 未存在`);
        continue;
      }

      const fileWithStats = await Promise.all(
        matchedFiles.map(async (fileName) => {
          const filePath = path.join(targetDir, fileName);
          const stat = await fs.stat(filePath);
          return { fileName, mtime: stat.mtime };
        }),
      );

      fileWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const latest = fileWithStats[0];
      const formattedDate = format(latest.mtime, "yyyy/MM/dd HH:mm:ss");

      addLine(`▶ [${kw}] 検出: ${latest.fileName}`);
      addLine(`   └ 更新日時: ${formattedDate}`);
    }
  } else {
    /* ------------------------------------------------------------
     *  それ以外の Status 時のロジック (SVフォルダ内の当日本体ファイル確認)
     * ------------------------------------------------------------ */
    addLine(`【判定モード: 処理済み・退避ファイル確認 (SV)】`);

    for (const kw of KEYWORDS) {
      const prefix = `${kw}_${today}`;

      // 当日日付プレフィックスで始まる拡張子なしファイルを検索
      const matchedFiles = files.filter(
        (f) => f.startsWith(prefix) && !path.extname(f),
      );

      if (matchedFiles.length === 0) {
        missing.push(`${prefix}*`);
        addLine(`❌ [${kw}] 当日ファイル未存在 (期待: ${prefix}*)`);
        continue;
      }

      const fileWithStats = await Promise.all(
        matchedFiles.map(async (fileName) => {
          const filePath = path.join(targetDir, fileName);
          const stat = await fs.stat(filePath);
          return { fileName, mtime: stat.mtime };
        }),
      );

      fileWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const latest = fileWithStats[0];
      const formattedDate = format(latest.mtime, "yyyy/MM/dd HH:mm:ss");

      addLine(`▶ [${kw}] 検出: ${latest.fileName}`);
      addLine(`   └ 更新日時: ${formattedDate}`);
    }
  }

  addLine(`--------------------------------------------------`);

  if (missing.length > 0) {
    throw new Error(
      `ファイル不足 (欠損: ${missing.join(", ")})\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [JobN12] 正常終了 (全4ファイル確認完了)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}

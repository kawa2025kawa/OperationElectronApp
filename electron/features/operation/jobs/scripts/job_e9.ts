// electron/features/operation/jobs/scripts/job_e9.ts

import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import { isSameDay, format } from "date-fns";

const execAsync = promisify(exec);

// 🎯 UNCパスは明確に \\\\ から始める
const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";

// 期待する対象ファイルの総数
const EXPECTED_FILE_COUNT = 16;

/**
 * 送信先フォルダから「FPOPHAT」で始まり「拡張子が .TXT」かつ「本日更新された」テキストファイルを動的に取得（ちょうど16件必要）
 */
async function getTodayTargetFiles(dirPath: string): Promise<{
  paths: string[];
  fileNames: string[];
}> {
  const now = new Date();
  const matchedPaths: string[] = [];
  const matchedFileNames: string[] = [];

  // 1. ディレクトリ内の全ファイルを取得
  const allFiles = await fs.readdir(dirPath);

  // 2. 「FPOPHAT」で始まり、かつ拡張子が「.TXT / .txt」のファイルのみを抽出（大文字小文字を区別しない）
  const targetNames = allFiles.filter((fileName) => {
    const upperName = fileName.toUpperCase();
    return upperName.startsWith("FPOPHAT") && upperName.endsWith(".TXT");
  });

  console.log(
    `[Job E9] FPOPHATテキストファイル検出数: ${targetNames.length}件 / 期待数: ${EXPECTED_FILE_COUNT}件`,
  );

  // 3. 件数チェック（16件存在しない場合はエラー）
  if (targetNames.length !== EXPECTED_FILE_COUNT) {
    throw new Error(
      `対象ファイルの件数が一致しません（期待値: ${EXPECTED_FILE_COUNT}件, 検出数: ${targetNames.length}件）\n検出ファイル: ${
        targetNames.length > 0 ? targetNames.join(", ") : "なし"
      }`,
    );
  }

  // 4. 各ファイルの本日更新チェック
  for (const fileName of targetNames) {
    const filePath = `${dirPath}\\${fileName}`;
    const stat = await fs.stat(filePath);

    if (!isSameDay(stat.mtime, now)) {
      const fileDateStr = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");
      const todayStr = format(now, "yyyy/MM/dd");
      throw new Error(
        `ファイルが本日更新されていません: ${fileName} (更新日時: ${fileDateStr}, 本日: ${todayStr})`,
      );
    }

    matchedPaths.push(filePath);
    matchedFileNames.push(fileName);
  }

  return { paths: matchedPaths, fileNames: matchedFileNames };
}

/**
 * PowerShell を使用してファイルを PASS 無し ZIP 圧縮
 */
async function compressToZip(
  sourceFilePaths: string[],
  outputZipPath: string,
): Promise<void> {
  if (await fs.pathExists(outputZipPath)) {
    await fs.remove(outputZipPath);
  }

  const fileListStr = sourceFilePaths.map((p) => `'${p}'`).join(",");
  const psCommand = `powershell -Command "Compress-Archive -Path ${fileListStr} -DestinationPath '${outputZipPath}' -Force"`;

  await execAsync(psCommand);
}

export async function runJobE9(): Promise<string> {
  console.log("[Job E9] 処理を開始します...");

  // 1. ディレクトリの存在判定
  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`送信先ディレクトリに接続できません: ${TARGET_DIR}`);
  }

  // 2. 「FPOPHAT」から始まる本日更新の16件のテキストファイルを取得
  const { paths: targetFiles, fileNames } =
    await getTodayTargetFiles(TARGET_DIR);

  console.log(
    "[Job E9] 圧縮対象ファイル一覧:\n" +
      fileNames.map((f, i) => `  ${i + 1}. ${f}`).join("\n"),
  );

  // 3. デスクトップパスおよび出力先 ZIP ファイル名の定義
  const desktopDir = path.join(os.homedir(), "Desktop");
  const todayStr = format(new Date(), "yyyyMMdd");
  const zipFileName = `SendData_POP_${todayStr}.zip`;
  const outputZipPath = path.join(desktopDir, zipFileName);

  // 4. PowerShell による ZIP 圧縮の実行
  await compressToZip(targetFiles, outputZipPath);

  const fileListLog = fileNames
    .map((name, idx) => `\n ${idx + 1}. ${name}`)
    .join("");

  return `正常終了: デスクトップに ${zipFileName} を作成しました（計 16 件）\n\n【圧縮対象ファイル】${fileListLog}`;
}

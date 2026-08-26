// electron/features/operation/jobs/scripts/job_e30.ts

import path from "node:path";
import { parseMeisYosan } from "./helpers/job-e30/meis-yosan";
import { parseUriYosan } from "./helpers/job-e30/uri-yosan";

interface InputFiles {
  meis0120Path: string;
  uriYosanPath: string;
}

function findInputFiles(inputPaths: string[]): InputFiles {
  let meis0120Path: string | undefined;
  let uriYosanPath: string | undefined;

  for (const filePath of inputPaths) {
    const fileName = path.basename(filePath);

    if (!meis0120Path && fileName.includes("MEIS0120")) {
      meis0120Path = filePath;
      continue;
    }

    if (!uriYosanPath && fileName.includes("売上予算確認")) {
      uriYosanPath = filePath;
    }
  }

  if (!meis0120Path) {
    throw new Error("必要なファイルが不足しています: MEIS0120");
  }

  if (!uriYosanPath) {
    throw new Error("必要なファイルが不足しています: 売上予算確認");
  }

  return {
    meis0120Path,
    uriYosanPath,
  };
}

export async function runJobE30(
  inputFilePath?: string | string[],
): Promise<string> {
  const inputPaths = inputFilePath
    ? Array.isArray(inputFilePath)
      ? inputFilePath
      : [inputFilePath]
    : [];

  if (inputPaths.length === 0) {
    throw new Error("比較対象ファイルがありません。");
  }

  const { meis0120Path, uriYosanPath } = findInputFiles(inputPaths);

  const [{ resultMap: meisMap }, { resultMap: uriMap }] = await Promise.all([
    parseMeisYosan(meis0120Path),
    parseUriYosan(uriYosanPath),
  ]);

  let matchedCount = 0;
  let ignoredCount = 0;
  let hasDifference = false;

  // 合計金額計算用の変数
  let totalUriAmount = 0;
  let totalMeisAmount = 0;

  const detailLines: string[] = [];
  const sortedStoreCodes = Array.from(uriMap.keys()).sort();

  for (const storeCode of sortedStoreCodes) {
    const uriAmount = uriMap.get(storeCode)!;

    // MEIS側に存在しない場合は対象外
    if (!meisMap.has(storeCode)) {
      ignoredCount++;
      continue;
    }

    matchedCount++;
    const meisAmount = meisMap.get(storeCode)!;
    const diff = uriAmount - meisAmount;

    // 合計金額に加算
    totalUriAmount += uriAmount;
    totalMeisAmount += meisAmount;

    if (Math.abs(diff) > 0.0001) {
      hasDifference = true;
    }

    const diffSign =
      diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();
    detailLines.push(
      `店舗[${storeCode}] 予算:${uriAmount.toLocaleString()}円 | MEIS:${meisAmount.toLocaleString()}円 | 差:${diffSign}円`,
    );
  }

  // 全体の差額計算
  const totalDiff = totalUriAmount - totalMeisAmount;
  const totalDiffSign =
    totalDiff > 0
      ? `+${totalDiff.toLocaleString()}`
      : totalDiff.toLocaleString();

  const statusHeader = hasDifference ? "【相違あり】" : "【相違なし】";

  // ヘッダー情報（カウント ＋ 合計金額＆合計差額）
  const headerLines = [
    `${statusHeader} (突合:${matchedCount}件, 対象外:${ignoredCount}件)`,
    `[合計] 売上予算: ${totalUriAmount.toLocaleString()}円 | MEIS: ${totalMeisAmount.toLocaleString()}円 | 差額: ${totalDiffSign}円`,
    "--------------------------------------------------------------------------------",
  ];

  const resultComment = `${headerLines.join("\n")}\n${detailLines.join("\n")}`;

  if (hasDifference) {
    throw new Error(resultComment);
  }

  return resultComment;
}

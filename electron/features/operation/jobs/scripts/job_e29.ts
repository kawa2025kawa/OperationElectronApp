import { parseMeisYosan } from "./helpers/job-e29/meis-yosan";
import { parseRealYosan } from "./helpers/job-e29/real-yosan";
import {
  buildSummaryComment,
  calculateStoreDiffs,
} from "./helpers/job-e29/store-diff-helper";
import { findJobE29InputFiles } from "./helpers/job-e29/file-helper"; // インポートを追加

export async function runJobE29(
  inputFilePath?: string | string[],
): Promise<string> {
  const inputPaths = inputFilePath
    ? Array.isArray(inputFilePath)
      ? inputFilePath
      : [inputFilePath]
    : [];

  if (inputPaths.length === 0) {
    throw new Error("入力ファイルが指定されていません");
  }

  // 共通ヘルパーを使用するように変更[cite: 1]
  const { realYosanPath, meis0120Path } = findJobE29InputFiles(inputPaths);

  const [realYosanResult, meisYosanResult] = await Promise.all([
    parseRealYosan(realYosanPath),
    parseMeisYosan(meis0120Path),
  ]);

  const results = calculateStoreDiffs(
    realYosanResult.resultMap,
    meisYosanResult.resultMap,
  );

  return buildSummaryComment(results);
}

//electron\features\operation\jobs\scripts\job_e29.ts

import path from "path";

import { parseRealYosan } from "./helpers/job-e29/real-yosan";
import { parseMeisYosan } from "./helpers/job-e29/meis-yosan";
import {
  buildSummaryComment,
  calculateStoreDiffs,
} from "./helpers/job-e29/store-diff-helper";

interface InputFiles {
  realYosanPath: string;
  meis0120Path: string;
}

function findInputFiles(inputPaths: string[]): InputFiles {
  let realYosanPath: string | undefined;
  let meis0120Path: string | undefined;

  for (const filePath of inputPaths) {
    const fileName = path.basename(filePath);

    if (!realYosanPath && fileName.includes("リアル予算")) {
      realYosanPath = filePath;
      continue;
    }

    if (!meis0120Path && fileName.includes("MEIS0120")) {
      meis0120Path = filePath;
    }
  }

  if (!realYosanPath) {
    throw new Error("必要なファイルが不足しています: リアル予算");
  }

  if (!meis0120Path) {
    throw new Error("必要なファイルが不足しています: MEIS0120");
  }

  return {
    realYosanPath,
    meis0120Path,
  };
}

export async function runJobE29(
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

  const { realYosanPath, meis0120Path } = findInputFiles(inputPaths);

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

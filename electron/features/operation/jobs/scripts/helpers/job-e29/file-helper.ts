//electron\features\operation\jobs\scripts\helpers\job-e29\file-helper.ts

import path from "path";
import type { InputFiles } from "./types";

export function findJobE29InputFiles(inputPaths: string[]): InputFiles {
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

  if (!realYosanPath || !meis0120Path) {
    const missing: string[] = [];

    if (!realYosanPath) {
      missing.push("リアル予算");
    }

    if (!meis0120Path) {
      missing.push("MEIS0120");
    }

    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return {
    realYosanPath,
    meis0120Path,
  };
}

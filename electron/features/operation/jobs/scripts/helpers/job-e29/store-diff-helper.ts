//electron\features\operation\jobs\scripts\helpers\job-e29\store-diff-helper.ts

import type { StoreDiffResult, StoreYosanMap } from "./types";

export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

export function calculateStoreDiffs(
  realYosanMap: StoreYosanMap,
  mdYosanMap: StoreYosanMap,
): StoreDiffResult[] {
  const storeCodes = new Set<string>([
    ...realYosanMap.keys(),
    ...mdYosanMap.keys(),
  ]);

  return [...storeCodes].sort(compareStoreCodes).map((storeCode) => {
    const realYosan = realYosanMap.get(storeCode) ?? 0;
    const mdYosan = mdYosanMap.get(storeCode) ?? 0;
    return {
      storeCode,
      realYosan,
      mdYosan,
      diff: realYosan - mdYosan,
    };
  });
}

function compareStoreCodes(codeA: string, codeB: string): number {
  if (codeA === "全店") {
    return -1;
  }

  if (codeB === "全店") {
    return 1;
  }

  const numA = Number(codeA);
  const numB = Number(codeB);

  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return codeA.localeCompare(codeB, "ja-JP");
}

export function buildSummaryComment(results: StoreDiffResult[]): string {
  const totalReal = results.reduce((sum, result) => sum + result.realYosan, 0);
  const totalMd = results.reduce((sum, result) => sum + result.mdYosan, 0);
  const totalDiff = totalReal - totalMd;
  return [
    `リアル予算計=${formatYen(totalReal)}`,
    `MD予算計=${formatYen(totalMd)}`,
    `差分=${formatYen(totalDiff)}`,
  ].join(" / ");
}

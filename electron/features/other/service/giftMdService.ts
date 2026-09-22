// electron/features/other/service/giftMdService.ts

import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";

export async function giftMdProcess(
  filePath?: string | string[],
): Promise<string> {
  // giftMdProcess は Operation の Job E41 と同じロジックのため共通処理を直接利用
  return await runJobE41(filePath);
}

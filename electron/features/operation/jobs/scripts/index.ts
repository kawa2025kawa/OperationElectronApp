/* ============================================================================
 * Main Process / Job Dispatcher
 * ========================================================================== */

import { runJob114 } from "./job_114";
import { runJob16 } from "./job_16";
import { runJob20 } from "./job_20";
import { runJob25 } from "./job_25";
import { runJob28 } from "./job_28";
import { runJob34 } from "./job_34";
import { runJob39 } from "./job_39";
import { runJob56 } from "./job_56";
import { runJob62 } from "./job_62";
import { runJob64 } from "./job_64";
import { runJob66 } from "./job_66";
import { runJob80 } from "./job_80";
import { runJobE14 } from "./job_e14";
import { runJobE29 } from "./job_e29";
import { runJobE30 } from "./job_e30";
import { runJobE5 } from "./job_e5";
import { runJobN12 } from "./job_n12";
import { runJobN20 } from "./job_n20";
import { runJobN31 } from "./job_n31";
import { runJobN33 } from "./job_n33";

import type { JobResult } from "@shared/types/operation";

type ScriptFilePath = string | string[];

type JobRunner = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

const jobRunners: Record<string, JobRunner> = {
  "114": () => runJob114(),
  "16": () => runJob16(),
  "20": () => runJob20(),
  "25": () => runJob25(),
  "28": () => runJob28(),
  "43": () => runJob28(), // ★ 共通処理割り当て
  "68": () => runJob28(), // ★ 共通処理割り当て
  "34": () => runJob34(),
  "39": () => runJob39(),
  "56": () => runJob56(),
  "62": () => runJob62(),
  "64": () => runJob64(),
  "66": () => runJob66(),
  "80": () => runJob80(),

  e14: (_kanriNo, filePath) => runJobE14(filePath),
  e29: (_kanriNo, filePath) => runJobE29(filePath),
  e30: (_kanriNo, filePath) => runJobE30(filePath),
  e5: (_kanriNo, filePath) => runJobE5(filePath),

  n12: () => runJobN12(),
  n20: () => runJobN20(),
  n31: (kanriNo) => runJobN31(kanriNo),
  n33: () => runJobN33(),
};

export async function dispatchScript(
  kanriNo: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const normalized = String(kanriNo).trim().toLowerCase();
  const runner = jobRunners[normalized];

  if (!runner) {
    throw new Error(`未対応の管理No.です: ${kanriNo}`);
  }

  const result = await runner(normalized, filePath);

  return typeof result === "string" ? { message: result } : result;
}

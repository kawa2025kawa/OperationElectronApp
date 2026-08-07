// electron/services/operation/jobs/scripts/index.ts
import { runJob16 } from "./job_16";
import { runJob20 } from "./job_20";
import { runJob25 } from "./job_25";
import { runJob34 } from "./job_34";
import { runJob39 } from "./job_39";
import { runJob62 } from "./job_62";
import { runJob64 } from "./job_64";
import { runJob80 } from "./job_80";
import { runJob114 } from "./job_114";
import { runJobE5 } from "./job_e5";
import { runJobN12 } from "./job_n12";
import { runJobN20 } from "./job_n20";
import { runJobN31 } from "./job_n31";
import { runJobN33 } from "./job_n33";

export async function dispatchScript(
  kanriNo: string,
  onProgress?: (message: string) => void,
): Promise<string> {
  const cleanId = kanriNo.trim();

  switch (cleanId) {
    case "16":
      return await runJob16();
    case "20":
      return await runJob20();
    case "25":
      return await runJob25();
    case "34":
      return await runJob34();
    case "39":
      return await runJob39();
    case "62":
      return await runJob62();
    case "64":
      return await runJob64();
    case "80":
      return await runJob80();
    case "114":
      return await runJob114();
    case "E5":
      return await runJobE5();
    case "N12":
      return await runJobN12(onProgress);
    case "N20":
      return await runJobN20();
    case "N31":
      return await runJobN31(cleanId);
    case "N33":
      return await runJobN33();
    default:
      throw new Error(`未定義のジョブ番号: ${cleanId}`);
  }
}

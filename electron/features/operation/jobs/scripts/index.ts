//electron\features\operation\jobs\scripts\index.ts

import { runJob16 } from "./job_16";
import { runJob20 } from "./job_20";
import { runJob25 } from "./job_25";
import { runJob28 } from "./job_28";
import { runJob30 } from "./job_30";
import { runJob34 } from "./job_34";
import { runJob39 } from "./job_39";
import { runJob56 } from "./job_56";
import { runJob62 } from "./job_62";
import { runJob64 } from "./job_64";
import { runJob80 } from "./job_80";
import { runJob114 } from "./job_114";
import { runJobE5 } from "./job_e5";
import { runJobN12 } from "./job_n12";
import { runJobN20 } from "./job_n20";
import { runJobN31 } from "./job_n31";
import { runJobN33 } from "./job_n33";

export async function dispatchScript(kanriNo: string): Promise<string> {
  const cleanId = kanriNo.trim();

  switch (cleanId) {
    case "16":
      return runJob16();
    case "20":
      return runJob20();
    case "25":
      return runJob25();
    case "28":
    case "43":
    case "68":
      return runJob28();
    case "30":
    case "37":
    case "45":
    case "54":
      return runJob30();
    case "34":
      return runJob34();
    case "39":
      return runJob39();
    case "56":
      return runJob56();
    case "62":
      return runJob62();
    case "64":
      return runJob64();
    case "80":
      return runJob80();
    case "114":
      return runJob114();
    case "E5":
      return runJobE5();
    case "N12":
      return runJobN12();
    case "N20":
      return runJobN20();
    case "N31":
      return runJobN31(cleanId);
    case "N33":
      return runJobN33();
    default:
      throw new Error(`未定義のジョブ番号: ${cleanId}`);
  }
}

// electron/features/operation/jobs/scripts/rdp/job_rdp.ts

import { findRdpTarget } from "@electron/features/rdp/rdpResolver";
import { launchRdp } from "@electron/features/rdp/rdpConnection";

export async function runJobRdp(targetKey: string): Promise<string> {
  const target = await findRdpTarget(targetKey);

  await launchRdp({
    ipAddress: target.ipAddress,
    userName: target.userName,
    password: target.password,
  });

  return `${target.name} への RDP 接続を開始しました`;
}

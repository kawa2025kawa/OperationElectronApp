// electron\features\rdp\rdpConnection.ts

import { execFile } from "node:child_process";
import util from "node:util";

const execFilePromise = util.promisify(execFile);

export interface RdpConnectionParams {
  ipAddress: string;
  userName?: string;
  password?: string;
}

export async function launchRdp({
  ipAddress,
  userName,
  password,
}: RdpConnectionParams): Promise<void> {
  const cleanIp = ipAddress.trim();

  if (!cleanIp) {
    throw new Error("IPアドレスが指定されていません");
  }

  if (userName?.trim() && password?.trim()) {
    await execFilePromise("cmdkey", [
      `/generic:TERMSRV/${cleanIp}`,
      `/user:${userName.trim()}`,
      `/pass:${password.trim()}`,
    ]);
  }

  execFile("mstsc", [`/v:${cleanIp}`]);
}

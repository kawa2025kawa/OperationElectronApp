// electron/features/rdp/rdpService.ts

import { execFile } from "node:child_process";
import util from "node:util";

import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import type { RdpMaster } from "./rdpMasterTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

const execFilePromise = util.promisify(execFile);

interface LaunchRdpParams {
  ipAddress: string;
  userName?: string;
  password?: string;
}

const RDP_COMMANDS = {
  cmdkey: "cmdkey",
  mstsc: "mstsc",
} as const;

/** Renderer に公開する RDP 接続先一覧を取得する。 */
export async function getRdpTargets(): Promise<RdpTarget[]> {
  const { rdps } = await getSpreadsheetMasterData();

  return rdps.map(({ name, ipAddress }) => ({
    name,
    ipAddress,
  }));
}

/** Main 側で指定名称に一致する RDP 接続情報を取得する。 */
async function findRdpTarget(name: string): Promise<RdpMaster> {
  const cleanName = name.trim().toUpperCase();

  if (!cleanName) {
    throw new Error("RDP接続先が指定されていません");
  }

  const { rdps } = await getSpreadsheetMasterData();
  const target = rdps.find(
    (item) => item.name?.trim().toUpperCase() === cleanName,
  );

  if (!target) {
    throw new Error(`RDP接続情報が見つかりません: ${name}`);
  }

  if (!target.ipAddress?.trim()) {
    throw new Error(`RDP接続先のIPアドレスが設定されていません: ${name}`);
  }

  return target;
}

/** Windows の mstsc コマンドを起動して対象ホストへの接続を開く。 */
async function launchRdp(params: LaunchRdpParams): Promise<void> {
  const cleanIp = params.ipAddress.trim();

  if (!cleanIp) {
    throw new Error("IPアドレスが指定されていません");
  }

  if (params.userName?.trim() && params.password?.trim()) {
    await execFilePromise(RDP_COMMANDS.cmdkey, [
      `/generic:TERMSRV/${cleanIp}`,
      `/user:${params.userName.trim()}`,
      `/pass:${params.password.trim()}`,
    ]);
  }

  execFile(RDP_COMMANDS.mstsc, [`/v:${cleanIp}`], (error) => {
    if (error) {
      console.error(`[RDP] mstsc launch failed for ${cleanIp}:`, error);
    }
  });
}

/** 指定名称の RDP 情報を取得し、接続セッションを開始する。 */
export async function startRdpSession(name: string): Promise<string> {
  const target = await findRdpTarget(name);

  await launchRdp({
    ipAddress: target.ipAddress,
    userName: target.userName,
    password: target.password,
  });

  return `${target.name} への RDP 接続を開始しました`;
}

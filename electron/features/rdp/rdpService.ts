// electron/features/rdp/rdpService.ts

import { execFile } from "node:child_process";
import util from "node:util";
import { getJsonMasterData } from "@electron/features/masterData/application/jsonMasterDataManager";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

const execFilePromise = util.promisify(execFile);

// JSONマスタからRDP接続先端末の一覧を取得して返す。
export async function getRdpTargets(): Promise<RdpMaster[]> {
  const masterData = await getJsonMasterData();
  return masterData.rdps;
}

// 指定された名称(name)に合致するRDP接続先情報をマスタから検索して取得する。
export async function findRdpTarget(name: string): Promise<RdpMaster> {
  const cleanName = name.trim().toUpperCase();

  if (!cleanName) {
    throw new Error("RDP接続先が指定されていません");
  }

  const rdps = await getRdpTargets();
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

// Windowsのmstscコマンドを起動して対象ホストへのリモートデスクトップ接続を開く。
export async function launchRdp(params: {
  ipAddress: string;
  userName?: string;
  password?: string;
}): Promise<void> {
  const cleanIp = params.ipAddress.trim();

  if (!cleanIp) {
    throw new Error("IPアドレスが指定されていません");
  }

  if (params.userName?.trim() && params.password?.trim()) {
    await execFilePromise("cmdkey", [
      `/generic:TERMSRV/${cleanIp}`,
      `/user:${params.userName.trim()}`,
      `/pass:${params.password.trim()}`,
    ]);
  }

  execFile("mstsc", [`/v:${cleanIp}`], (error) => {
    if (error) {
      console.error(`[RDP] mstsc launch failed for ${cleanIp}:`, error);
    }
  });
}

// 対象名称(name)のRDP情報を取得し、リモートデスクトップ接続セッションを開始する。
export async function startRdpSession(name: string): Promise<string> {
  const target = await findRdpTarget(name);
  await launchRdp({
    ipAddress: target.ipAddress,
    userName: target.userName,
    password: target.password,
  });
  return `${target.name} への RDP 接続を開始しました`;
}

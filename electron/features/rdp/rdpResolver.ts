// electron/features/rdp/rdpResolver.ts

import { getJsonMasterData } from "@electron/features/masterData/application/jsonMasterDataManager";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

export async function findRdpTarget(name: string): Promise<RdpMaster> {
  const cleanName = name.trim().toUpperCase();

  if (!cleanName) {
    throw new Error("RDP接続先が指定されていません");
  }

  const masterData = await getJsonMasterData();

  const target = masterData.rdps.find(
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

export async function getRdpTargets(): Promise<RdpMaster[]> {
  const masterData = await getJsonMasterData();
  return masterData.rdps;
}

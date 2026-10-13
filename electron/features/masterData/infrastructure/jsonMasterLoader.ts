// electron/features/masterData/infrastructure/jsonMasterLoader.ts

import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";
import { fetchDriveJson } from "./driveJsonClient";

export type JsonMasterDataSource = Pick<
  import("@shared/types/masterData/jsonMasterDataTypes").JsonMasterData,
  "operations" | "irregulars" | "rdps"
>;

async function fetchJsonWithLogging<T extends object>(
  fileName: string,
): Promise<T[]> {
  try {
    const data = await fetchDriveJson<T>(fileName);

    if (!Array.isArray(data)) {
      throw new Error(`${fileName} のデータ形式が配列ではありません`);
    }

    return data;
  } catch (err) {
    console.error(`[JsonMasterLoader] ${fileName} の取得に失敗:`, err);

    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${fileName} の取得に失敗しました: ${message}`);
  }
}

export async function loadJsonMasterData(): Promise<JsonMasterDataSource> {
  const [operations, irregulars, rdps] = await Promise.all([
    fetchJsonWithLogging<OperationMaster>("Operation.json"),
    fetchJsonWithLogging<IrregularMaster>("Irregular.json"),
    fetchJsonWithLogging<RdpMaster>("Rdp.json"),
  ]);

  return {
    operations,
    irregulars,
    rdps,
  };
}

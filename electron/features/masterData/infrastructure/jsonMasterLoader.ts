// electron/features/masterData/infrastructure/jsonMasterLoader.ts

import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";
import { fetchDriveJson } from "./driveJsonClient";

// JSON マスターローダーが返す運用・不定期運用・RDPデータの型。
export type JsonMasterDataSource = Pick<
  import("@shared/types/masterData/jsonMasterDataTypes").JsonMasterData,
  "operations" | "irregulars" | "rdps"
>;

// 指定 JSON ファイルを取得し、失敗時にファイル名を含むエラーを記録して再送出する。
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
    throw new Error(`${fileName} の取得に失敗しました: ${message}`, {
      cause: err,
    });
  }
}

// Google Drive から3種類の JSON マスターデータを並行取得して返す。
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

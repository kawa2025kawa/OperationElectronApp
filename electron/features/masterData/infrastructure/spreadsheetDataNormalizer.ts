import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import { normalizeMasterDataRows } from "./masterDataNormalizer";

export const normalizeSpreadsheetRows = normalizeMasterDataRows;

export function normalizeSpreadsheetMasterData(
  data: SpreadsheetMasterData,
): SpreadsheetMasterData {
  return {
    stores: normalizeMasterDataRows(data.stores ?? []),
    kokyuhyos: normalizeMasterDataRows(data.kokyuhyos ?? []),
    jugyoin: normalizeMasterDataRows(data.jugyoin ?? []),
    kokyuhyoTantous: normalizeMasterDataRows(data.kokyuhyoTantous ?? []),
  };
}

// src/shared/types/masterData/jsonMasterDataTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

export interface JsonMasterData {
  operations: OperationMaster[];
  irregulars: IrregularMaster[];
  todayIrregulars: TodayIrregularMaster[];
  rdps: RdpMaster[];
}

export interface JsonMasterDataCache {
  fetchedAt: string;
  data: JsonMasterData;
}

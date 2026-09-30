// src/renderer/features/operation/helpers/entityUtils.ts

import type { AppState } from "@renderer/store";
import {
  selectIrregularMasters,
  selectOperationMasters,
  selectTodayIrregularMasters,
} from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type {
  OperationMaster,
  IrregularMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

export type MasterRow =
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster;

const MANUAL_ALIAS_MAP: Readonly<Record<string, string>> = {
  "37": "30",
  "45": "30",
  "48": "30",
  "54": "30",
  "36": "29",
  "44": "29",
  "47": "29",
  "43": "28",
  "68": "28",
};

export function getManualUrl(kanriNo: string): string {
  const target = MANUAL_ALIAS_MAP[kanriNo] ?? kanriNo;

  return `https://sites.google.com/belc.co.jp/operation-manual-${target}`;
}

export function getStatusForKanriNo(
  state: Pick<
    AppState,
    "operationStatuses" | "irregularStatuses" | "todayStatuses"
  >,
  kanriNo: string,
): OperationStatusState {
  return (
    state.operationStatuses[kanriNo] ??
    state.irregularStatuses[kanriNo] ??
    state.todayStatuses[kanriNo] ??
    {}
  );
}

export function findMasterByKanriNo(
  state: AppState,
  kanriNo: string,
): MasterRow | undefined {
  const operationMasters = selectOperationMasters(state);
  const todayIrregularMasters = selectTodayIrregularMasters(state);
  const irregularMasters = selectIrregularMasters(state);

  return (
    operationMasters.find((item) => String(item.kanriNo) === kanriNo) ??
    todayIrregularMasters.find((item) => String(item.kanriNo) === kanriNo) ??
    irregularMasters.find((item) => String(item.kanriNo) === kanriNo)
  );
}

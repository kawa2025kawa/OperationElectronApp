// src/shared/store/slices/helpers/operationEntities.ts

import type { AppState } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";

export type OperationEntities = Record<string, OperationItem>;

/**
 * 通常ジョブ + 異常系ジョブを統合したEntity一覧を取得
 */
export const getAllEntities = (state: AppState): OperationEntities => ({
  ...state.operationEntities,
  ...state.irregularEntities,
});

/**
 * 管理番号から対象Entityを取得
 */
export const findEntityByKanriNo = (
  state: AppState,
  kanriNo: string,
): OperationItem | undefined => {
  return getAllEntities(state)[kanriNo];
};

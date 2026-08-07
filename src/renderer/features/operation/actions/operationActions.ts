// src/renderer/features/operation/actions/operationActions.ts

import { showToast } from "@shared/utils/toastUtils";
import { useAppStore, type AppState } from "@shared/store";

import { checkJobDependencies } from "@shared/store/slices/helpers/dependencyHelper";
import {
  selectOperationTableData,
  selectIrregularTableData,
  selectActiveSelectedItem,
} from "@shared/store/selectors/operationSelectors";

import { operationViewConfig } from "@renderer/features/operation/config/operationView";

import type { OperationItem } from "@shared/types/operationType";

/**
 * Zustand state取得
 */
const getState = (): AppState => useAppStore.getState();

/**
 * 現在モードに応じた選択コンテキスト取得
 */
const getSelectionContext = (state: AppState) => {
  const isIrregular = state.currentMode === "irregular";

  return {
    data: isIrregular
      ? selectIrregularTableData(state)
      : selectOperationTableData(state),

    currentId: isIrregular
      ? state.selectedIrregularId
      : state.selectedOperationId,

    setSelectedId: isIrregular
      ? state.setSelectedIrregularId
      : state.setSelectedOperationId,
  };
};

/**
 * 行選択
 */
export function selectOperation(item: OperationItem): void {
  const { setSelectedId } = getSelectionContext(getState());

  setSelectedId(item.kanriNo);
}

/**
 * 下方向へ選択移動
 */
export function moveSelectionDown(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());

  if (data.length === 0) return;

  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : -1;

  const nextIndex = Math.min(currentIndex + 1, data.length - 1);

  setSelectedId(data[Math.max(0, nextIndex)].kanriNo);
}

/**
 * 上方向へ選択移動
 */
export function moveSelectionUp(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());

  if (data.length === 0) return;

  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : data.length;

  const prevIndex = Math.max(0, currentIndex - 1);

  setSelectedId(data[prevIndex].kanriNo);
}

/**
 * View Action 実行
 */
export function executeOperationAction(actionKey: string): void {
  const state = getState();

  const selectedItem = selectActiveSelectedItem(state);

  if (!selectedItem) return;

  const action = operationViewConfig.actions?.find(
    (item) => item.key === actionKey,
  );

  if (!action) return;

  if (!action.isActive(selectedItem)) return;

  action.execute(selectedItem, {
    openGlobalModal: state.openGlobalModal,
    closeGlobalModal: state.closeGlobalModal,
  });
}

/**
 * Enterキー完了処理
 */
export async function completeSelectedOperation(): Promise<void> {
  const state = getState();

  const selectedItem = selectActiveSelectedItem(state);

  if (!selectedItem) return;

  const dependencyOk = checkJobDependencies(
    selectedItem.kanriNo,
    {
      ...state.operationEntities,
      ...state.irregularEntities,
    },
    state.jobDependencies ?? {
      dependencies: {},
    },
  );

  if (!dependencyOk) {
    showToast("前提ジョブが未完了です", "error");

    return;
  }

  await state.updateJobStatus({
    kanriNo: selectedItem.kanriNo,
    status: "success",
    comment: "",
  });
}

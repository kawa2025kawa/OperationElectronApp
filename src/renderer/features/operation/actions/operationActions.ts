// src/renderer/features/operation/actions/operationActions.ts

import { useAppStore, type AppState } from "@shared/store";
import { showToast } from "@shared/utils/toastUtils";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { checkJobDependencies } from "@renderer/features/operation/helpers/dependencyHelper";
import {
  selectActiveSelectedItem,
  selectIrregularTableData,
  selectOperationTableData,
} from "@renderer/features/operation/store/operationSelectors";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";

const getState = (): AppState => useAppStore.getState();

const getSelectionContext = (state: AppState) => {
  const mode = state.currentMode;
  return {
    data:
      mode === "irregular"
        ? selectIrregularTableData(state)
        : selectOperationTableData(state),
    currentId: state.selectedIds[mode],
    setSelectedId: (id: string | null) => state.setSelectedId(mode, id),
  };
};

export function selectOperation(item: OperationItem): void {
  const { setSelectedId } = getSelectionContext(getState());
  setSelectedId(item.kanriNo);
}

export function moveSelectionDown(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());
  if (data.length === 0) return;
  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : -1;
  const nextIndex = Math.min(currentIndex + 1, data.length - 1);
  setSelectedId(data[Math.max(0, nextIndex)].kanriNo);
}

export function moveSelectionUp(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());
  if (data.length === 0) return;
  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : data.length;
  const prevIndex = Math.max(0, currentIndex - 1);
  setSelectedId(data[prevIndex].kanriNo);
}

export function executeOperationAction(actionKey: string): void {
  const state = getState();
  const selectedItem = selectActiveSelectedItem(state);
  if (!selectedItem) return;

  const action = operationViewConfig.actions?.find(
    (item) => item.key === actionKey,
  );
  if (!action || !action.isActive(selectedItem)) return;

  action.execute(selectedItem, {
    openGlobalModal: state.openGlobalModal,
    closeGlobalModal: state.closeGlobalModal,
  });
}

export async function completeSelectedOperation(): Promise<void> {
  const state = getState();
  const selectedItem = selectActiveSelectedItem(state);
  if (!selectedItem) return;

  // 🎯 ストアからアクティブフラグを取得して統合
  const activeFlags = {
    is1CActive: state.is1CActive,
    is2CActive: state.is2CActive,
    is3CActive: state.is3CActive,
  };

  const depResult = checkJobDependencies(
    selectedItem.kanriNo,
    {
      ...state.operationEntities,
      ...state.irregularEntities,
    },
    activeFlags,
  );

  if (!depResult.ok) {
    showToast("前提作業が完了していません", "error");
    return;
  }

  await state.updateJobStatus({
    kanriNo: selectedItem.kanriNo,
    status: JOB_STATUS.SUCCESS,
    comment: "",
  });

  showToast(`作業 [No.${selectedItem.kanriNo}] を完了しました`, "success");
}

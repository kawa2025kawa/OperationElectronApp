// src/renderer/features/operation/useOperationViewLogic.ts

import { useCallback, useMemo } from "react";

import type { ViewMode } from "@renderer/registry/appRegistry";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { useAppStore } from "@renderer/store";
import type {
  OperationViewItem,
  SelectedOperationItem,
} from "@shared/types/operation/operationTypes";

import { createActiveActions, type ViewAction } from "./operationMenuActions";
import { createInfoRows, type InfoRowData } from "./operationInfoRows";

export type {
  InfoRowData,
  OperationViewItem,
  SelectedOperationItem,
  ViewAction,
};

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

export function useOperationViewLogic() {
  const currentMode = useAppStore((state) => state.currentMode);
  const setMode = useAppStore((state) => state.setMode);
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const { item: selectedItem, status } = useAppStore(
    selectActiveItemStatusFlags,
  );

  const activeActions = useMemo(
    () =>
      selectedItem ? createActiveActions(selectedItem, openGlobalModal) : [],
    [openGlobalModal, selectedItem],
  );

  const executeAction = useCallback(
    async (key: string) => {
      if (!selectedItem) {
        return;
      }

      const action = activeActions.find(
        ({ key: actionKey }) => actionKey === key,
      );

      if (!action) {
        return;
      }

      await action.execute(selectedItem);
    },
    [activeActions, selectedItem],
  );

  const infoRows = useMemo(
    () => createInfoRows(currentMode, selectedItem, status),
    [currentMode, selectedItem, status],
  );

  return {
    currentMode,
    activeActions,
    infoRows,
    status,
    isMenuVisible: Boolean(selectedItem && activeActions.length),
    setMode,
    executeAction,
  };
}

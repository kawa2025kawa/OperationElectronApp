// src/renderer/features/operation/components/buttonPanel/useButtonPanel.ts
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { useAppStore } from "@shared/store/index";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import { JOB_STATUS } from "@shared/types/operationType";
import type { ViewMode } from "@shared/types/uiType";

export const useButtonPanel = () => {
  const { item: selectedItem, status } = useAppStore(
    useShallow(selectActiveItemStatusFlags),
  );
  const {
    currentMode,
    rawSetMode,
    setSelectedOperationId,
    setSelectedIrregularId,
    openGlobalModal,
    closeGlobalModal,
  } = useAppStore(
    useShallow((s) => ({
      currentMode: s.currentMode,
      rawSetMode: s.setMode,
      setSelectedOperationId: s.setSelectedOperationId,
      setSelectedIrregularId: s.setSelectedIrregularId,
      openGlobalModal: s.openGlobalModal,
      closeGlobalModal: s.closeGlobalModal,
    })),
  );

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      rawSetMode(mode);
      setSelectedOperationId(null);
      setSelectedIrregularId(null);
    },
    [rawSetMode, setSelectedOperationId, setSelectedIrregularId],
  );

  const isScriptRunning = status === JOB_STATUS.scriptRunning;
  const configuredActions = operationViewConfig.actions ?? [];

  const executeAction = useCallback(
    (key: string) => {
      const action = configuredActions.find((a) => a.key === key);
      if (action && selectedItem) {
        action.execute(selectedItem, { openGlobalModal, closeGlobalModal });
      }
    },
    [configuredActions, selectedItem, openGlobalModal, closeGlobalModal],
  );

  const checkIsDisabled = useCallback(
    (key: string) => {
      if (isScriptRunning || !selectedItem) return true;
      const action = configuredActions.find((a) => a.key === key);
      return action ? !action.isActive(selectedItem) : true;
    },
    [configuredActions, selectedItem, isScriptRunning],
  );

  return {
    currentMode,
    isScriptRunning,
    configuredActions,
    handleModeChange,
    executeAction,
    checkIsDisabled,
  };
};

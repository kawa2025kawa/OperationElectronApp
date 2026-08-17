import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { JOB_STATUS } from "@shared/types/operationType";

export const useButtonPanel = () => {
  const { item: selectedItem, status } = useAppStore(
    useShallow(selectActiveItemStatusFlags),
  );
  const { currentMode, setMode, openGlobalModal, closeGlobalModal } =
    useAppStore(
      useShallow((s) => ({
        currentMode: s.currentMode,
        setMode: s.setMode,
        openGlobalModal: s.openGlobalModal,
        closeGlobalModal: s.closeGlobalModal,
      })),
    );

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      setMode(mode);
    },
    [setMode],
  );

  const isScriptRunning = status === JOB_STATUS.SCRIPT_RUNNING;
  const configuredActions = useMemo(
    () => operationViewConfig.actions ?? [],
    [],
  );

  const executeAction = useCallback(
    (key: string) => {
      const action = configuredActions.find((action) => action.key === key);
      if (!action || !selectedItem) return;
      action.execute(selectedItem, {
        openGlobalModal,
        closeGlobalModal,
      });
    },
    [configuredActions, selectedItem, openGlobalModal, closeGlobalModal],
  );

  const checkIsDisabled = useCallback(
    (key: string) => {
      if (isScriptRunning || !selectedItem) return true;
      const action = configuredActions.find((action) => action.key === key);
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

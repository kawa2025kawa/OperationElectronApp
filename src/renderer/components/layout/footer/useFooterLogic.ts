// src/renderer/components/layout/footer/useFooterLogic.ts
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store/index";
import { APP_VIEW_IDS } from "@shared/types/uiType";

export const useFooterLogic = () => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    toggleCenterPill,
    currentView,
    openGlobalModal,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      is1CActive: state.is1CActive,
      is2CActive: state.is2CActive,
      is3CActive: state.is3CActive,
      toggleCenterPill: state.toggleCenterPill,
      currentView: state.currentView,
      openGlobalModal: state.openGlobalModal,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const isOperationView = currentView === APP_VIEW_IDS.OPERATION;

  const handleToggle1C = useCallback(
    () => toggleCenterPill("is1CActive"),
    [toggleCenterPill],
  );
  const handleToggle2C = useCallback(
    () => toggleCenterPill("is2CActive"),
    [toggleCenterPill],
  );
  const handleToggle3C = useCallback(
    () => toggleCenterPill("is3CActive"),
    [toggleCenterPill],
  );

  return {
    is1CActive,
    is2CActive,
    is3CActive,
    isOperationView,
    handleToggle1C,
    handleToggle2C,
    handleToggle3C,
    // フッターコンポーネント側でモーダルを開けるように関数を返す
    openGlobalModal,
    closeGlobalModal,
  };
};

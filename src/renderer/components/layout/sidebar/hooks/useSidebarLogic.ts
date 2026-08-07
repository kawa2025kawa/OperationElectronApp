import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import type { AppViewId } from "@shared/types/uiType";

export const useSidebarLogic = () => {
  const { setSidebarOpen, setCurrentView } = useAppStore(
    useShallow((s) => ({
      setSidebarOpen: s.setSidebarOpen,
      setCurrentView: s.setCurrentView,
    })),
  );

  const handleItemClick = useCallback(
    (view: AppViewId) => {
      setSidebarOpen(false);
      setCurrentView(view);
    },
    [setSidebarOpen, setCurrentView],
  );

  return {
    handleItemClick,
  };
};

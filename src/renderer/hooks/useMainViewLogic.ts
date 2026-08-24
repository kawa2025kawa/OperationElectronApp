import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store";
import { useAutoUpdate } from "@renderer/hooks/useAutoUpdate";
import { useStatusToast } from "@renderer/hooks/useStatusToast";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { AuthView } from "@renderer/features/auth/AuthView";

export const useMainViewLogic = () => {
  useAutoUpdate();
  useStatusToast();

  const { currentView, isSidebarOpen, isAuthenticated } = useAppStore(
    useShallow((s: AppState) => ({
      currentView: s.currentView,
      isSidebarOpen: s.isSidebarOpen,
      isAuthenticated: s.isAuthenticated,
    })),
  );

  const ViewComponent = useMemo(() => {
    const viewConfig = getAppViewConfig(currentView);

    // ビュー定義の isProtected フラグによる動的ガード
    if (!isAuthenticated && viewConfig.isProtected) {
      return AuthView;
    }

    return viewConfig.component;
  }, [currentView, isAuthenticated]);

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
  };
};

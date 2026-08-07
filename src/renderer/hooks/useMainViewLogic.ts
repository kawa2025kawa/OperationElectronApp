import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store";
import { useAutoUpdate } from "@renderer/hooks/useAutoUpdate";
import { useStatusToast } from "@renderer/hooks/useStatusToast";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { AuthView } from "@renderer/features/auth/AuthView";

// 認証が必要なビューIDのリスト
const PROTECTED_VIEWS = [
  "kokyuhyo",
  "jugyoin",
  "store",
  "tantou",
  "spreadsheet",
];

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
    // 未認証で保護対象のビューを開こうとした場合は AuthView を強制返却
    const isProtected = PROTECTED_VIEWS.includes(currentView.toLowerCase());
    if (!isAuthenticated && isProtected) {
      return AuthView;
    }

    return getAppViewConfig(currentView).component;
  }, [currentView, isAuthenticated]);

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
  };
};

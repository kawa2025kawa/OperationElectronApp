//src\renderer\hooks\useMainViewLogic.ts

import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { useAutoUpdate } from "@renderer/hooks/useAutoUpdate";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

export const useMainViewLogic = () => {
  useAutoUpdate();

  const { currentView, isSidebarOpen } = useAppStore(
    useShallow((state: AppState) => ({
      currentView: state.currentView,
      isSidebarOpen: state.isSidebarOpen,
    })),
  );

  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
  };
};

//src\renderer\hooks\useMainViewLogic.ts
import { useAppStore } from "@renderer/store";
import { useAutoUpdate } from "@renderer/hooks/useAutoUpdate";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

export const useMainViewLogic = () => {
  useAutoUpdate();

  const currentView = useAppStore((s) => s.currentView);
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
  };
};

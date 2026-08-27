//src\renderer\hooks\useMainViewLogic.ts

import { useAppStore } from "@shared/store";
import { selectActiveViewComponent } from "@shared/store/slices/navigationSlice";
import { useAutoUpdate } from "@renderer/hooks/useAutoUpdate";
import { useStatusToast } from "@renderer/hooks/useStatusToast";

export const useMainViewLogic = () => {
  useAutoUpdate();
  useStatusToast();

  const currentView = useAppStore((s) => s.currentView);
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const ViewComponent = useAppStore(selectActiveViewComponent);

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
  };
};

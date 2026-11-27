// src/renderer/App.tsx

import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import {
  AppStartupLoader,
  Overlay,
  ProcessingLoader,
} from "@renderer/components/ui/overlay/Overlay";
import { TooltipProvider } from "@renderer/components/ui/tooltip/Tooltip";
import { useAppInitialization } from "@renderer/hooks/useAppInitialization";
import { MainView } from "@renderer/layout/MainView";

export const App = () => {
  const { isSidebarOpen, handleOverlayClick } = useAppInitialization();

  return (
    <TooltipProvider delay={250} closeDelay={80}>
      <MainView />

      <Overlay isOpen={isSidebarOpen} onClick={handleOverlayClick} />

      <PollingToast />
      <GlobalModalManager />
      <ProcessingLoader />
      <AppStartupLoader />
    </TooltipProvider>
  );
};

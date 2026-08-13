// src/renderer/App.tsx
import React from "react";
import { Toaster } from "sonner";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import { MainView } from "@renderer/layout/MainView";
import { useIpcManager } from "@renderer/hooks/useIpcManager";
import { useAppLogic } from "@renderer/hooks/useAppLogic";

export const App: React.FC = () => {
  useIpcManager();

  const {
    theme,
    initStatus,
    showAppLoader,
    isGlobalProcessing,
    overlayMessage,
    processingTarget,
  } = useAppLogic();

  if (showAppLoader) {
    return (
      <LoadingOverlay
        isOpen
        message="INITIALIZING APPLICATION..."
        statusMessage="INITIALIZING SYSTEM CORE"
        dataStatus={initStatus}
      />
    );
  }

  return (
    <>
      <Toaster
        theme={theme === "dark" ? "dark" : "light"}
        position="top-right"
        richColors
        closeButton
      />
      <MainView />
      <GlobalModalManager />
      <LoadingOverlay
        isOpen={isGlobalProcessing}
        message={overlayMessage}
        processingTarget={processingTarget}
      />
    </>
  );
};

export default App;

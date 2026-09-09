// src/renderer/App.tsx

import React from "react";

import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import { MainView } from "@renderer/layout/MainView";
import { useAppLogic } from "@renderer/hooks/useAppLogic";

export const App: React.FC = () => {
  const {
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
      <MainView />
      <PollingToast />
      <GlobalModalManager />
      <LoadingOverlay
        isOpen={isGlobalProcessing}
        message={overlayMessage}
        processingTarget={processingTarget}
      />
    </>
  );
};

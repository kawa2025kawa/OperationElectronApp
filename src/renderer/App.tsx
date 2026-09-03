// src/renderer/App.tsx

import React from "react";

import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import { MainView } from "@renderer/layout/MainView";
import { useAppLogic } from "@renderer/hooks/useAppLogic";

// Registry & Views
import { setupAppRegistry } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import { OperationView } from "@renderer/features/operation/OperationView";
import { AuthView } from "@renderer/features/auth/AuthView";
import { SpreadSheetView } from "@renderer/features/spreadSheet/SpreadSheetView";
import { OtherView } from "@renderer/features/other/OtherView";

// レンダラー起動時に View コンポーネントを一度だけ動的バインド
setupAppRegistry({
  [APP_VIEW_IDS.OPERATION]: OperationView,
  [APP_VIEW_IDS.RDP]: RdpView,
  [APP_VIEW_IDS.OTHER]: OtherView,
  [APP_VIEW_IDS.AUTH]: AuthView,
  [APP_VIEW_IDS.KOKYUHYO]: SpreadSheetView,
  [APP_VIEW_IDS.JUGYOIN]: SpreadSheetView,
  [APP_VIEW_IDS.SHOP]: SpreadSheetView,
  [APP_VIEW_IDS.TANTOU]: SpreadSheetView,
});

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

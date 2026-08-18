// src/renderer/App.tsx
import React from "react";
import { ToastContainer } from "@renderer/components/ui/toast/ToastContainer"; // ⭕ 追加
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import { MainView } from "@renderer/layout/MainView";
import { useIpcManager } from "@renderer/hooks/useIpcManager";
import { useAppLogic } from "@renderer/hooks/useAppLogic";

export const App: React.FC = () => {
  useIpcManager();

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
      <ToastContainer /> {/* ⭕ 旧 <Toaster> の代わりにここに配置 */}
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

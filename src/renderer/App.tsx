// src/renderer/App.tsx

import React, { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import { appService } from "@renderer/services/appService";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";
import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import { MainView } from "@renderer/layout/MainView";

export const App: React.FC = () => {
  const { theme, initStatus, globalProcessing, showAppLoader } = useAppStore(
    useShallow((state) => ({
      theme: state.theme ?? "dark",
      initStatus: state.initStatus ?? {},
      globalProcessing: state.globalProcessing ?? null,
      showAppLoader: state.showAppLoader ?? true,
    })),
  );

  // 1. 起動初期化の呼び出し
  useEffect(() => {
    void appService.initializeApp();
  }, []);

  // 2. テーマ適用
  useEffect(() => {
    const root = document.documentElement;
    const activeThemeClass =
      theme === "light" ? lightThemeClass : darkThemeClass;

    root.className = activeThemeClass;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  // 初期化中の画面（dataStatus から現在 LOADING のタスク名が自動で左下に表示される）
  if (showAppLoader) {
    return (
      <LoadingOverlay
        isOpen={true}
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
      {/* 🎯 割り込み処理用オーバーレイ（target を確実に連携） */}
      <LoadingOverlay
        isOpen={Boolean(globalProcessing)}
        message={globalProcessing?.message}
        processingTarget={globalProcessing?.target}
      />
    </>
  );
};

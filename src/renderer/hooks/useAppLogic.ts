// src/renderer/hooks/useAppLogic.ts

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";

export const useAppLogic = () => {
  const { theme, initStatus, showAppLoader, globalProcessing, initializeApp } =
    useAppStore(
      useShallow((state: AppState) => ({
        theme: state.theme,
        initStatus: state.initStatus,
        showAppLoader: state.showAppLoader,
        globalProcessing: state.globalProcessing,
        initializeApp: state.initializeApp,
      })),
    );

  // アプリ初期化の実行（ガードは initSlice 側で担保）
  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  // テーマクラスの DOM 反映
  useEffect(() => {
    document.body.className =
      theme === "dark" ? darkThemeClass : lightThemeClass;
  }, [theme]);

  return {
    theme,
    initStatus,
    showAppLoader,
    isGlobalProcessing: globalProcessing !== null,
    overlayMessage: globalProcessing?.message ?? "PROCESSING...",
    processingTarget: globalProcessing?.target ?? null,
  };
};

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";
import { initializeAppAction } from "@renderer/features/app/actions";

export const useAppLogic = () => {
  const isInitialized = useRef(false);
  const [isInitCompleted, setIsInitCompleted] = useState(false);
  const [showAppLoader, setShowAppLoader] = useState(true);

  const { theme, initStatus, globalProcessing } = useAppStore(
    useShallow((state: AppState) => ({
      theme: state.theme,
      initStatus: state.initStatus,
      globalProcessing: state.globalProcessing,
    })),
  );

  // 初期化アクションの実行（1回のみ）
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    void initializeAppAction()
      .catch((error) => {
        console.error("[useAppLogic] initializeAppAction failed:", error);
      })
      .finally(() => {
        setIsInitCompleted(true);
      });
  }, []);

  // 初期化完了後のローダー非表示制御
  useEffect(() => {
    if (!isInitCompleted) return;

    const timer = window.setTimeout(() => {
      setShowAppLoader(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isInitCompleted]);

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

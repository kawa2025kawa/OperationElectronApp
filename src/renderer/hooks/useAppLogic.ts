// src/renderer/hooks/useAppLogic.ts

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";
import { initializeAppAction } from "@renderer/features/app/actions";

export const useAppLogic = () => {
  const isInitialized = useRef(false);
  const [forceUnlock, setForceUnlock] = useState(false);

  const {
    theme,
    isChecking,
    isLoginProcessing,
    isLoading,
    pdfUploadProcessing,
    initStatus,
    uiGlobalProcessing,
    uiOverlayMessage,
  } = useAppStore(
    useShallow((s: AppState) => ({
      theme: s.theme,
      isChecking: s.isChecking,
      isLoginProcessing: s.isLoginProcessing,
      isLoading: s.isLoading,
      pdfUploadProcessing: s.pdfUpload?.isProcessing ?? false,
      initStatus: s.initStatus,
      uiGlobalProcessing: s.isGlobalProcessing,
      uiOverlayMessage: s.overlayMessage,
    })),
  );

  // 初期化アクションの発火 + ハング防止用タイマー
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // アクションの実行
    void initializeAppAction().catch((err) => {
      console.error("[useAppLogic] initializeAppAction failed:", err);
    });

    // 初期化が3秒以上終わらない場合は強制的に画面を表示させる
    const timer = setTimeout(() => {
      console.warn(
        "[useAppLogic] App initialization timed out. Force opening UI.",
      );
      setForceUnlock(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // テーマ切り替えの適用
  useEffect(() => {
    document.body.className =
      theme === "dark" ? darkThemeClass : lightThemeClass;
  }, [theme]);

  // 1. 初期化ローディング判定（タイムアウト時は強制解除）
  const showAppLoader = !forceUnlock && (isChecking || isLoading);

  // 2. 全体オーバーレイ状態の集約
  const isGlobalProcessing =
    isLoginProcessing || pdfUploadProcessing || uiGlobalProcessing;

  // 3. オーバーレイメッセージの優先順位集約
  const overlayMessage =
    (isLoginProcessing && "WAITING FOR GOOGLE AUTHENTICATION...") ||
    (pdfUploadProcessing && "UPLOADING PDF FILES...") ||
    uiOverlayMessage ||
    "PROCESSING...";

  useEffect(() => {
    console.log(
      "showAppLoader:",
      showAppLoader,
      "isGlobalProcessing:",
      isGlobalProcessing,
      "overlayMessage:",
      overlayMessage,
    );
  }, [showAppLoader, isGlobalProcessing, overlayMessage]);

  return {
    theme,
    initStatus,
    showAppLoader,
    isGlobalProcessing,
    overlayMessage,
  };
};

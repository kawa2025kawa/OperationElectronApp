// src/renderer/hooks/useAppInitialization.ts
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store/index";
import { initializeAppAction } from "@renderer/features/app/actions";

export const useAppInitialization = () => {
  const isInitialized = useRef(false);

  const { status, isInitialLoaded, isLoading } = useAppStore(
    useShallow((s: AppState) => ({
      status: s.initStatus,
      isInitialLoaded: s.isInitialLoaded,
      isLoading: s.isLoading,
    })),
  );

  useEffect(() => {
    // React 18 StrictMode 等による二重発火防止
    if (isInitialized.current) return;
    isInitialized.current = true;

    void initializeAppAction();
  }, []);

  return {
    status,
    isInitialLoaded,
    isLoading,
  };
};

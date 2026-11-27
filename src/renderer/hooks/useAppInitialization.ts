// src/renderer/hooks/useAppInitialization.ts

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import { darkThemeClass } from "@renderer/styles/tokens/theme.css";

export function useAppInitialization() {
  const { isSidebarOpen, initializeApp, setSidebarOpen } = useAppStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      initializeApp: state.initializeApp,
      setSidebarOpen: state.setSidebarOpen,
    })),
  );

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    const root = document.documentElement;
    root.className = darkThemeClass;
    root.setAttribute("data-theme", "dark");
    void initializeApp();
  }, [initializeApp]);

  return {
    isSidebarOpen,
    handleOverlayClick,
  };
}
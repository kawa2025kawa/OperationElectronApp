// src/renderer/App.tsx

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import { darkThemeClass } from "@renderer/styles/tokens/theme.css";
import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import {
  AppStartupLoader,
  Overlay,
  ProcessingLoader,
} from "@renderer/components/ui/overlay/Overlay";
import { MainView } from "@renderer/layout/MainView";

export const App = () => {
  const { isSidebarOpen, initializeApp, setSidebarOpen } = useAppStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen ?? false,
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

  return (
    <>
      <MainView />

      <Overlay isOpen={isSidebarOpen} onClick={handleOverlayClick} />

      <PollingToast />
      <GlobalModalManager />
      <ProcessingLoader />
      <AppStartupLoader />
    </>
  );
};
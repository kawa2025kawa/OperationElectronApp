// src/renderer/App.tsx

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import {
  darkThemeClass,
  lightThemeClass,
} from "@renderer/styles/tokens/theme.css";
import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import {
  AppStartupLoader,
  Overlay,
  ProcessingLoader,
} from "@renderer/components/ui/overlay/Overlay";
import { MainView } from "@renderer/layout/MainView";

export const App = () => {
  const { theme, showAppLoader, isSidebarOpen, initializeApp, setSidebarOpen } =
    useAppStore(
      useShallow((state) => ({
        theme: state.theme ?? "dark",
        showAppLoader: state.showAppLoader ?? true,
        isSidebarOpen: state.isSidebarOpen ?? false,
        initializeApp: state.initializeApp,
        setSidebarOpen: state.setSidebarOpen,
      })),
    );

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    const root = document.documentElement;
    const activeThemeClass =
      theme === "light" ? lightThemeClass : darkThemeClass;

    root.className = activeThemeClass;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <AppStartupLoader />

      {!showAppLoader && (
        <>
          <MainView />

          <Overlay isOpen={isSidebarOpen} onClick={handleOverlayClick} />

          <PollingToast />
          <GlobalModalManager />
          <ProcessingLoader />
        </>
      )}
    </>
  );
};

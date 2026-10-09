import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import { darkThemeClass, lightThemeClass } from "@renderer/styles/tokens";
import { PollingToast } from "@renderer/components/ui/toast/PollingToast";
import { GlobalModalManager } from "@renderer/components/ui/modal/GlobalModalManager";
import {
  AppStartupLoader,
  ProcessingLoader,
} from "@renderer/components/ui/overlay/LoadingOverlay";
import { MainView } from "@renderer/layout/MainView";
import { trpc } from "@renderer/lib/trpc"; // ← 追加

export const App = () => {
  const { theme, showAppLoader, initializeApp } = useAppStore(
    useShallow((state) => ({
      theme: state.theme ?? "dark",
      showAppLoader: state.showAppLoader ?? true,
      initializeApp: state.initializeApp,
    })),
  );

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
          <PollingToast />
          <GlobalModalManager />
          <ProcessingLoader />
        </>
      )}
    </>
  );
};

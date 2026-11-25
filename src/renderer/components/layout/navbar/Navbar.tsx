// src/renderer/components/layout/navbar/Navbar.tsx

import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

import { HamburgerButton } from "@renderer/components/ui/button/hamburgerButton/HamburgerButton";
import { PollingToggleButton } from "@renderer/components/ui/button/pollingToggleButton/PollingToggleButton";
import { TantouButton } from "@renderer/components/ui/button/tantouButton/TantouButton";
import { StatusSummary } from "@renderer/components/ui/statusSummary/StatusSummary";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import { APP_VIEW_IDS } from "@shared/types/registry/viewDefinition";

import * as styles from "./navbar.css";

export const Navbar = memo(function Navbar() {
  const { currentView, currentMode, isInitialLoaded, isAuthenticated } =
    useAppStore(
      useShallow((state: AppState) => ({
        currentView: state.currentView,
        currentMode: state.currentMode,
        isInitialLoaded: state.isInitialLoaded,
        isAuthenticated: state.isAuthenticated,
      })),
    );

  const navbarTitle = getAppViewConfig(currentView)?.title ?? "Unknown View";
  const isOperation = currentView === APP_VIEW_IDS.OPERATION;
  const isIrregular = currentMode === "irregular";

  const summaryDisplayType: "none" | "summary" | "placeholder" =
    !isOperation || isIrregular
      ? "none"
      : isInitialLoaded
        ? "summary"
        : "placeholder";

  const isKokyuhyo =
    currentView === APP_VIEW_IDS.KOKYUHYO && Boolean(isAuthenticated);

  return (
    <nav className={styles.container}>
      <HamburgerButton />

      <div className={styles.logoText}>{navbarTitle}</div>

      <div className={styles.centerItem}>
        {summaryDisplayType === "summary" && (
          <div className={styles.centerSummaryWrapper}>
            <StatusSummary />
          </div>
        )}

        {summaryDisplayType === "placeholder" && (
          <div className={styles.summaryPlaceholder} />
        )}
      </div>

      <div className={styles.rightGroup}>
        {isKokyuhyo && <TantouButton />}
        <PollingToggleButton />
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

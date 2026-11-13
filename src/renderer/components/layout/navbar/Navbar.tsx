// src/renderer/components/layout/navbar/Navbar.tsx

import { memo } from "react";

import { StatusSummary } from "@renderer/components/ui/statusSummary/StatusSummary";
import { HamburgerButton } from "@renderer/components/ui/button/hamburgerButton/HamburgerButton";
import { PollingToggleButton } from "@renderer/components/ui/button/pollingToggleButton/PollingToggleButton";

import { useNavbarLogic } from "./useNavbarLogic";
import * as styles from "./navbar.css";

export const Navbar = memo(function Navbar() {
  const { navbarTitle, summaryDisplayType } = useNavbarLogic();

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
        <PollingToggleButton />
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

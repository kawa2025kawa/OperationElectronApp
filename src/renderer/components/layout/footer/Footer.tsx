// src/renderer/components/layout/footer/Footer.tsx

import React from "react";
import * as styles from "./footer.css";
import { FooterActionButton } from "./components/FooterActionButton";
import { SearchField } from "@renderer/components/ui/searchField/SearchField";
import { useFooterLogic } from "./useFooterLogic";

const APP_VERSION = import.meta.env.APP_VERSION ?? "1.0.0";

export const Footer: React.FC = React.memo(() => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    searchTerm,
    searchPlaceholder,
    handleSearchChange,
    handleToggle1C,
    handleToggle2C,
    handleToggle3C,
  } = useFooterLogic();

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.copyrightText}>OperationApp v{APP_VERSION}</div>

      <div className={styles.centerSearchWrapper}>
        {searchPlaceholder && (
          <SearchField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
      </div>

      <div className={styles.controlsContainer}>
        <FooterActionButton
          label="1C"
          isActive={is1CActive}
          onClick={handleToggle1C}
        />

        <FooterActionButton
          label="2C"
          isActive={is2CActive}
          onClick={handleToggle2C}
        />

        <FooterActionButton
          label="3C"
          isActive={is3CActive}
          onClick={handleToggle3C}
        />
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

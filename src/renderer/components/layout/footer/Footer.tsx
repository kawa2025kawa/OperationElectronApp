// src/renderer/components/layout/footer/Footer.tsx

import React from "react";
import * as styles from "./footer.css";
import { FooterActionButton } from "./components/FooterActionButton";
import { SearchField } from "@renderer/components/ui/searchField/SearchField";
import { useFooterLogic } from "./useFooterLogic";
import { CENTER_IDS } from "@shared/types/operation";

const APP_VERSION = import.meta.env.APP_VERSION ?? "1.0.0";

export const Footer: React.FC = React.memo(() => {
  const logic = useFooterLogic();

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.copyrightText}>OperationApp v{APP_VERSION}</div>

      <div className={styles.centerSearchWrapper}>
        {logic.searchPlaceholder && (
          <SearchField
            value={logic.searchTerm}
            onChange={logic.handleSearchChange}
            placeholder={logic.searchPlaceholder}
          />
        )}
      </div>

      <div className={styles.controlsContainer}>
        {CENTER_IDS.map((id) => (
          <FooterActionButton
            key={id}
            label={id}
            isActive={logic.centers[id]}
            onClick={() => logic.handleToggleCenter(id)}
          />
        ))}
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

// src/renderer/components/layout/footer/Footer.tsx

import React from "react";
import * as styles from "./footer.css";
import { FooterActionButton } from "./components/FooterActionButton";
import { SearchField } from "@renderer/components/ui/searchField/SearchField";
import { useFooterLogic } from "./useFooterLogic";
import type { CenterId } from "@shared/types/operation/operationTypes";

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
        {/* 🎯 logic.centers のオブジェクトキー/値を直接ループさせる */}
        {Object.entries(logic.centers).map(([id, isActive]) => (
          <FooterActionButton
            key={id}
            label={id}
            isActive={isActive}
            onClick={() => logic.handleToggleCenter(id as CenterId)}
          />
        ))}
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

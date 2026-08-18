// src/renderer/components/layout/footer/Footer.tsx

import React, { useCallback } from "react";

import * as styles from "./footer.css";

import { FooterActionButton } from "@renderer/components/ui/button/footerActionButton/FooterActionButton";

import { TenpoMaticPdfUpLoadButton } from "@renderer/components/ui/button/tenpoMaticPdfUpLoadButton/TenpoMaticPdfUpLoadButton";

import { SearchField } from "@renderer/components/ui/searchField/SearchField";

import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

import { useFooterLogic } from "./useFooterLogic";

export const Footer: React.FC = () => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    isOperationView,
    searchTerm,
    searchPlaceholder,
    handleSearchChange,
    handleToggle1C,
    handleToggle2C,
    handleToggle3C,
    openGlobalModal,
    closeGlobalModal,
  } = useFooterLogic();

  const handleOpenPdfModal = useCallback(() => {
    openGlobalModal(
      <OperationModal type="pdfUpload" onClose={closeGlobalModal} />,
      {
        title: "PDF自動アップロード",
        width: "min(75vw, 850px)",
        height: "min(75vh, 650px)",
      },
    );
  }, [openGlobalModal, closeGlobalModal]);

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.copyrightText}>
        © 2026 OperationApp. All rights reserved.
      </div>

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
        {isOperationView && (
          <TenpoMaticPdfUpLoadButton onClick={handleOpenPdfModal} />
        )}

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
};

Footer.displayName = "Footer";

export default Footer;

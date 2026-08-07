// src/renderer/components/layout/footer/Footer.tsx
import React, { useCallback } from "react";
import * as styles from "./footer.css";
import { FooterActionButton } from "@renderer/components/ui/button/footerActionButton/FooterActionButton";
import { TenpoMaticPdfUpLoadButton } from "@renderer/components/ui/button/tenpoMaticPdfUpLoadButton/TenpoMaticPdfUpLoadButton";
import { useFooterLogic } from "./useFooterLogic";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

export const Footer: React.FC = () => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    isOperationView,
    handleToggle1C,
    handleToggle2C,
    handleToggle3C,
    openGlobalModal,
    closeGlobalModal,
  } = useFooterLogic();

  // ▼ JSXを組み立てて表示する処理を View（.tsx）側に配置
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
      <div className={styles.controlsContainer}>
        {/* 作業一覧画面でのみ PDFアップロードボタンを表示 */}
        {isOperationView && (
          <TenpoMaticPdfUpLoadButton onClick={handleOpenPdfModal} />
        )}

        {/* センター切り替えトグル */}
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

export default Footer;

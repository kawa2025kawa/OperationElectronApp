// src/renderer/features/other/components/modal/OtherModal.tsx

import React, { useMemo } from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { GmailModalContent } from "@renderer/features/other/components/modal/gmailModal/GmailModalContent";
import { PdfUploadModalContent } from "./pdfUploadModal/PdfUploadModalContent";
import {
  useOtherModalLogic,
  type ModalContentProps,
  type OtherModalType,
} from "./useOtherModalLogic";

import * as styles from "@renderer/features/operation/components/modal/operationModal.css";

interface OtherModalProps {
  type: OtherModalType;
  onClose: () => void;
  gmailTemplateSelection?: boolean;
}

export const OtherModal: React.FC<OtherModalProps> = React.memo(
  ({ type, onClose, gmailTemplateSelection = true }) => {
    const {
      title,
      isExecuted,
      setTitle,
      registerPrimaryAction,
      handlePrimaryClick,
      handleClose,
    } = useOtherModalLogic({
      type,
      onClose,
    });

    const commonProps: ModalContentProps = useMemo(
      () => ({
        onClose: handleClose,
        setTitle,
        registerPrimaryAction,
      }),
      [handleClose, setTitle, registerPrimaryAction],
    );

    const renderContent = () => {
      switch (type) {
        case "pdfUpload":
          return <PdfUploadModalContent {...commonProps} />;

        case "gmail":
          return (
            <GmailModalContent
              {...commonProps}
              forceTemplateSelection={gmailTemplateSelection}
            />
          );

        default:
          return null;
      }
    };

    const getPrimaryButtonLabel = () => {
      switch (type) {
        case "pdfUpload":
          return "アップロード";
        case "gmail":
          return "下書き保存";
        default:
          return "実行";
      }
    };

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>{title}</h2>
          {!isExecuted && <CloseButton onClick={handleClose} />}
        </header>

        <main className={styles.centerContent}>{renderContent()}</main>

        <footer className={styles.actionContainer}>
          {isExecuted ? (
            <button
              type="button"
              className={styles.button}
              onClick={handleClose}
            >
              OK
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={handleClose}
              >
                閉じる
              </button>

              <button
                type="button"
                className={styles.button}
                onClick={handlePrimaryClick}
              >
                {getPrimaryButtonLabel()}
              </button>
            </>
          )}
        </footer>
      </div>
    );
  },
);

OtherModal.displayName = "OtherModal";
export default OtherModal;

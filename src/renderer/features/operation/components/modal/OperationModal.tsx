import React, { useMemo } from "react";

import type { OperationItem } from "@shared/types/operationType";
import type { OperationModalType } from "@shared/types/uiType";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import { ConfirmModalContent } from "./confirmModal/ConfirmModalContent";
import { JcModalContent } from "./jcModal/JcModalContent";
import { LinkModalContent } from "./linkModal/LinkModalContent";
import { PdfUploadModalContent } from "./pdfUploadModal/PdfUploadModalContent";
import { ScriptModalContent } from "./scriptModal/ScriptModalContent";
import { SummaryModalContent } from "./summaryModal/SummaryModalContent";
import {
  useOperationModalLogic,
  type ModalContentProps,
} from "./useOperationModalLogic";

import * as styles from "./operationModal.css";

interface OperationModalProps {
  type: OperationModalType;
  items?: OperationItem[];
  onClose: () => void;
}

export const OperationModal: React.FC<OperationModalProps> = React.memo(
  ({ type, items = [], onClose }) => {
    const {
      title,
      selectedItem,
      urlValue,
      isExecuted,
      setTitle,
      registerPrimaryAction,
      handlePrimaryClick,
      handleClose,
    } = useOperationModalLogic({
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
        case "summary":
          return <SummaryModalContent {...commonProps} items={items} />;

        case "jc":
          return <JcModalContent {...commonProps} />;

        case "script":
          return <ScriptModalContent {...commonProps} />;

        case "pdfUpload":
          return <PdfUploadModalContent {...commonProps} />;

        case "link":
          return <LinkModalContent {...commonProps} />;

        case "url":
          return (
            <ConfirmModalContent {...commonProps} url={urlValue} label="URL" />
          );

        case "manual":
          return (
            <ConfirmModalContent
              {...commonProps}
              url={selectedItem?.kanriNo}
              baseUrl="https://sites.google.com/belc.co.jp/operation-manual-"
              label="マニュアル"
            />
          );

        default:
          return null;
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
                実行
              </button>
            </>
          )}
        </footer>
      </div>
    );
  },
);

OperationModal.displayName = "OperationModal";

export default OperationModal;

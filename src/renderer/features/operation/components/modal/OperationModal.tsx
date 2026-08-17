// src/renderer/features/operation/components/modal/OperationModal.tsx

import React, { useMemo } from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { OperationItem } from "@shared/types/operationType";
import type { ExtraModalType } from "@shared/types/uiType";
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
  type: ExtraModalType;
  items?: OperationItem[];
  onClose: () => void;
}

export const OperationModal: React.FC<OperationModalProps> = React.memo(
  ({ type, items = [], onClose }) => {
    const {
      title,
      selectedItem,
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

              {/* 🎯 summary 以外のモーダルの時だけ実行ボタンを表示 */}
              {type !== "summary" && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={handlePrimaryClick}
                >
                  実行
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    );
  },
);

OperationModal.displayName = "OperationModal";

export default OperationModal;

// src/renderer/features/operation/components/modal/OperationModal.tsx

import React, { useMemo } from "react";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import type { OperationItem } from "@shared/types/operationType";
import type { ExtraModalType } from "@shared/types/uiType";

import { GmailModalContent } from "./gmailModal/GmailModalContent";
import { LinkModalContent } from "./linkModal/LinkModalContent";
import { PdfUploadModalContent } from "./pdfUploadModal/PdfUploadModalContent";
import { SummaryModalContent } from "./summaryModal/SummaryModalContent";
import {
  useOperationModalLogic,
  type ModalContentProps,
} from "./useOperationModalLogic";

import * as styles from "./operationModal.css";

// =====================================================
// Types
// =====================================================

interface OperationModalProps {
  type: ExtraModalType;
  items?: OperationItem[];
  onClose: () => void;

  /**
   * Gmailモーダルを開いた際に、
   * kanriNoによるテンプレート自動選択を行わず、
   * ユーザーにテンプレートを選択させる。
   *
   * 主にOtherViewから「下書きメール」を
   * 新規作成する場合に使用する。
   */
  gmailTemplateSelection?: boolean;
}

// =====================================================
// Component
// =====================================================

export const OperationModal: React.FC<OperationModalProps> = React.memo(
  ({ type, items = [], onClose, gmailTemplateSelection = false }) => {
    const {
      title,
      isExecuted,
      setTitle,
      registerPrimaryAction,
      handlePrimaryClick,
      handleClose,
    } = useOperationModalLogic({
      type,
      onClose,
    });

    // =================================================
    // Common Props
    // =================================================

    const commonProps: ModalContentProps = useMemo(
      () => ({
        onClose: handleClose,
        setTitle,
        registerPrimaryAction,
      }),
      [handleClose, setTitle, registerPrimaryAction],
    );

    // =================================================
    // Content
    // =================================================

    const renderContent = () => {
      switch (type) {
        case "summary":
          return <SummaryModalContent {...commonProps} items={items} />;

        case "pdfUpload":
          return <PdfUploadModalContent {...commonProps} />;

        case "link":
          return <LinkModalContent {...commonProps} />;

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

    // =================================================
    // Primary Button
    // =================================================

    const getPrimaryButtonLabel = () => {
      switch (type) {
        case "gmail":
          return "下書き保存";

        default:
          return "実行";
      }
    };

    const shouldShowPrimaryButton = type !== "summary";

    // =================================================
    // Render
    // =================================================

    return (
      <div className={styles.container}>
        {/* Header */}

        <header className={styles.header}>
          <h2 className={styles.modalTitle}>{title}</h2>

          {!isExecuted && <CloseButton onClick={handleClose} />}
        </header>

        {/* Content */}

        <main className={styles.centerContent}>{renderContent()}</main>

        {/* Footer */}

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

              {shouldShowPrimaryButton && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={handlePrimaryClick}
                >
                  {getPrimaryButtonLabel()}
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

// src/renderer/features/operation/components/modal/OperationModal.tsx

import React, { useMemo } from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { OperationItem } from "@shared/types/operationType";
import type { ExtraModalType } from "@shared/types/uiType";
import { LinkModalContent } from "./linkModal/LinkModalContent";
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
}

// =====================================================
// Component
// =====================================================

export const OperationModal: React.FC<OperationModalProps> = React.memo(
  ({ type, items = [], onClose }) => {
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

        case "link":
          return <LinkModalContent {...commonProps} />;

        default:
          return null;
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

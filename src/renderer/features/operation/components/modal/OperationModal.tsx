import React, { useMemo } from "react";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { Button } from "@renderer/components/ui/button/basicButton/BasicButton";

import type { OperationItem } from "@shared/types/operation";
import type { ExtraModalType } from "@shared/types/ui";

import { LinkModalContent } from "./linkModal/LinkModalContent";
import { ScriptModalContent } from "./scriptModal/ScriptModalContent";
import { SummaryModalContent } from "./summaryModal/SummaryModalContent";
import { useOperationModalLogic } from "./useOperationModalLogic";
import { OperationModalProvider } from "./OperationModalProvider";

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
      kanriNo,
      isPrimaryDisabled,
      setTitle,
      registerPrimaryAction,
      handlePrimaryClick,
      handleClose,
    } = useOperationModalLogic({
      type,
      onClose,
    });

    // 子コンポーネントへ提供する Context 値（バケツリレーを防止）
    const contextValue = useMemo(
      () => ({
        kanriNo,
        setTitle,
        registerPrimaryAction,
        onClose: handleClose,
      }),
      [kanriNo, setTitle, registerPrimaryAction, handleClose],
    );

    const content = useMemo(() => {
      switch (type) {
        case "summary":
          return <SummaryModalContent items={items} />;

        case "link":
          return <LinkModalContent />;

        case "script":
          return <ScriptModalContent />;

        default:
          return null;
      }
    }, [items, type]);

    const shouldShowPrimaryButton = type !== "summary";

    return (
      <OperationModalProvider value={contextValue}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.modalTitle}>{title}</h2>
            <CloseButton onClick={handleClose} />
          </header>

          <main className={styles.centerContent}>{content}</main>

          <footer className={styles.actionContainer}>
            <Button onClick={handleClose}>閉じる</Button>

            {shouldShowPrimaryButton && (
              <Button onClick={handlePrimaryClick} disabled={isPrimaryDisabled}>
                実行
              </Button>
            )}
          </footer>
        </div>
      </OperationModalProvider>
    );
  },
);

OperationModal.displayName = "OperationModal";

OperationModal;

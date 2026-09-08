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
      secondaryLabel,
      isSecondaryDisabled,
      hasSecondaryAction,
      setTitle,
      registerPrimaryAction,
      registerSecondaryAction,
      handlePrimaryClick,
      handleSecondaryClick,
      handleClose,
    } = useOperationModalLogic({
      type,
      onClose,
    });

    // 子コンポーネントへ提供する Context 値（セカンダリアクションを追加）
    const contextValue = useMemo(
      () => ({
        kanriNo,
        setTitle,
        registerPrimaryAction,
        registerSecondaryAction,
        onClose: handleClose,
      }),
      [
        kanriNo,
        setTitle,
        registerPrimaryAction,
        registerSecondaryAction,
        handleClose,
      ],
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

            {/* サブアクション（E5の「送信済みデータの確認」など）が登録されている場合のみ表示 */}
            {hasSecondaryAction && (
              <Button
                onClick={handleSecondaryClick}
                disabled={isSecondaryDisabled}
              >
                {secondaryLabel}
              </Button>
            )}

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

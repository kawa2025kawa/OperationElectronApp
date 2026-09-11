// src/renderer/components/ui/modal/GlobalModalManager.tsx

import React from "react";
import ReactDOM from "react-dom";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { useGlobalModalManager } from "./useGlobalModalManager";
import * as styles from "./globalModalManager.css";

export const GlobalModalManager: React.FC = () => {
  const { state, actions } = useGlobalModalManager();

  if (!state.isOpen || !state.content || !state.modalRoot) return null;

  const isComponent =
    typeof state.content === "function" ||
    (typeof state.content === "object" &&
      state.content !== null &&
      "type" in state.content);

  const ModalComponent = isComponent
    ? (state.content as React.ComponentType)
    : null;

  const messageType = (state.message?.type ??
    "info") as keyof typeof styles.messageTypes;
  const messageClass =
    styles.messageTypes[messageType] ?? styles.messageTypes.info;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={actions.handleCancel}>
      <div
        className={styles.modalWindow}
        style={{
          width: state.dimensions.width,
          height: state.dimensions.height,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LoadingOverlay
          isOpen={state.isProcessing}
          message="PROCESSING"
          statusMessage="処理を実行中..."
        />

        {/* ヘッダー */}
        <header className={styles.header}>
          <h2 className={styles.title}>{state.title}</h2>
          <CloseButton
            onClick={actions.handleCancel}
            disabled={state.isProcessing}
          />
        </header>

        {/* メッセージ領域 */}
        {state.message && (
          <div className={`${styles.messageBanner} ${messageClass}`}>
            {state.message.text}
          </div>
        )}

        {/* 本文エリア */}
        <main className={styles.body}>
          {ModalComponent ? (
            <ModalComponent />
          ) : (
            (state.content as React.ReactNode)
          )}
        </main>

        {/* フッター */}
        {!state.hideFooter && (
          <footer className={styles.footer}>
            {state.footerContent ?? (
              <>
                <ActionButton
                  variant="default"
                  onClick={actions.handleCancel}
                  disabled={state.isProcessing}
                >
                  {state.cancelText}
                </ActionButton>
                <ActionButton
                  variant="default"
                  onClick={actions.handleConfirm}
                  disabled={state.isConfirmDisabled || state.isProcessing}
                >
                  {state.isProcessing ? "処理中..." : state.confirmText}
                </ActionButton>
              </>
            )}
          </footer>
        )}
      </div>
    </div>,
    state.modalRoot,
  );
};

GlobalModalManager.displayName = "GlobalModalManager";

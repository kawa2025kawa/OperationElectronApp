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

        {/* 🎯 フッター（伸縮対応 & クラス化でスッキリ整理） */}
        {!state.hideFooter && (
          <footer className={styles.footer}>
            {state.footerContent ?? (
              <div className={styles.footerContainer}>
                {/* 左側アクションボタン群 (自動伸縮エリア) */}
                <div className={styles.footerLeft}>
                  {state.leftActions.map((action) => (
                    <ActionButton
                      key={action.id}
                      className={styles.footerLeftButton}
                      variant={action.variant ?? "default"}
                      onClick={() => void action.onClick()}
                      disabled={action.disabled || state.isProcessing}
                    >
                      {action.label}
                    </ActionButton>
                  ))}
                </div>

                {/* 右側アクションボタン群 (固定エリア) */}
                <div className={styles.footerRight}>
                  {state.rightActions.map((action) => (
                    <ActionButton
                      key={action.id}
                      variant={action.variant ?? "default"}
                      onClick={() => void action.onClick()}
                      disabled={action.disabled || state.isProcessing}
                    >
                      {action.label}
                    </ActionButton>
                  ))}
                </div>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>,
    state.modalRoot,
  );
};

GlobalModalManager.displayName = "GlobalModalManager";

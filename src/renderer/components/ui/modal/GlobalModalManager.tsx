// src/renderer/components/ui/modal/GlobalModalManager.tsx

import { createPortal } from "react-dom";

import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";

import * as styles from "./globalModalManager.css";
import { useGlobalModalManager } from "./useGlobalModalManager";

export const GlobalModalManager = () => {
  const { state, actions } = useGlobalModalManager();

  if (!state.isOpen || !state.content || !state.modalRoot) {
    return null;
  }

  const messageType = state.message?.type ?? "info";
  const messageClass =
    styles.messageTypes[messageType] ?? styles.messageTypes.info;

  const footerContent = state.footerContent ?? (
    <div className={styles.footerContainer}>
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
  );

  return createPortal(
    <div className={styles.overlay} onClick={actions.handleCancel}>
      <div
        className={styles.modalWindow}
        style={{
          width: state.dimensions.width,
          height: state.dimensions.height,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <LoadingOverlay
          isOpen={state.isProcessing}
          message="PROCESSING"
          statusMessage="処理を実行中..."
        />

        <header className={styles.header}>
          <h2 className={styles.title}>{state.title}</h2>

          <CloseButton
            onClick={actions.handleCancel}
            disabled={state.isProcessing}
          />
        </header>

        {state.message && (
          <div className={`${styles.messageBanner} ${messageClass}`}>
            {state.message.text}
          </div>
        )}

        <main className={styles.body}>{state.content}</main>

        {!state.hideFooter && (
          <footer className={styles.footer}>{footerContent}</footer>
        )}
      </div>
    </div>,
    state.modalRoot,
  );
};

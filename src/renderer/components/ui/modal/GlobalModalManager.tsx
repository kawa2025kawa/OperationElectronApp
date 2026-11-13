// src/renderer/components/ui/modal/GlobalModalManager.tsx

import { useMemo } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import * as styles from "./globalModalManager.css";
import { useGlobalModalManager } from "./useGlobalModalManager";

export const GlobalModalManager = () => {
  const { state, actions } = useGlobalModalManager();

  const messageType = state.message?.type ?? "info";
  const messageClass =
    styles.messageTypes[messageType] ?? styles.messageTypes.info;

  const defaultFooter = useMemo(
    () => (
      <div className={styles.footerContainer}>
        <div className={styles.footerRight}>
          {state.rightActions.map((action) => (
            <ActionButton
              key={action.id}
              variant={action.variant ?? "default"}
              onClick={action.onClick}
              disabled={action.disabled || state.isProcessing}
            >
              {action.label}
            </ActionButton>
          ))}
        </div>
      </div>
    ),
    [state.rightActions, state.isProcessing],
  );

  const footerContent = state.footerContent ?? defaultFooter;

  if (!state.modalRoot) {
    return null;
  }

  return (
    <Dialog.Root
      open={state.isOpen && Boolean(state.content)}
      onOpenChange={(open) => {
        if (!open) {
          actions.handleCancel();
        }
      }}
    >
      <Dialog.Portal container={state.modalRoot}>
        <Dialog.Backdrop className={styles.overlay} />

        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup
            className={styles.modalWindow}
            style={{
              width: state.dimensions.width,
              height: state.dimensions.height,
            }}
          >
            <header className={styles.header}>
              <Dialog.Title className={styles.title}>
                {state.title}
              </Dialog.Title>

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
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// src/renderer/components/ui/modal/GlobalModalManager.tsx

import { memo } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import * as styles from "./globalModalManager.css";
import { useGlobalModalManager } from "./useGlobalModalManager";

export const GlobalModalManager = memo(function GlobalModalManager() {
  const { state, actions } = useGlobalModalManager();

  if (!state.modalRoot) {
    return null;
  }

  return (
    <Dialog.Root open={state.isOpen} onOpenChange={actions.handleOpenChange}>
      <Dialog.Portal container={state.modalRoot}>
        <Dialog.Backdrop className={styles.overlay} />

        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup
            finalFocus={false}
            className={styles.modalWindow}
            style={state.popupStyle}
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
              <div className={`${styles.messageBanner} ${state.messageClass}`}>
                {state.message.text}
              </div>
            )}

            <main className={styles.body}>{state.content}</main>

            {!state.hideFooter && (
              <footer className={styles.footer}>
                {state.footerContent ?? (
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
                )}
              </footer>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
});

GlobalModalManager.displayName = "GlobalModalManager";
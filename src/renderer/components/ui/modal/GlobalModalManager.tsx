// src/renderer/components/ui/modal/GlobalModalManager.tsx

import { memo, useCallback, useMemo } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { clsx } from "clsx";
import { useShallow } from "zustand/shallow";

import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { useAppStore } from "@renderer/store";
import { MODAL_SIZES, type ModalAction } from "@renderer/types/modal";

import * as styles from "./globalModalManager.css";

export const GlobalModalManager = memo(function GlobalModalManager() {
  const { isOpen, content, config, closeModal } = useAppStore(
    useShallow((state) => ({
      isOpen: state.modal.isOpen,
      content: state.modal.content,
      config: state.modal.config,
      closeModal: state.closeGlobalModal,
    })),
  );

  const isProcessing = config?.isProcessing ?? false;

  const handleCancel = useCallback(() => {
    if (isProcessing) return;
    config?.onCancel?.();
    closeModal();
  }, [isProcessing, config, closeModal]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isProcessing) {
        handleCancel();
      }
    },
    [isProcessing, handleCancel],
  );

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  const width = config?.width ?? MODAL_SIZES.DEFAULT.width;
  const height = config?.height ?? MODAL_SIZES.DEFAULT.height;
  const popupStyle = useMemo(() => ({ width, height }), [width, height]);

  const rightActions = config?.rightActions;
  const computedRightActions = useMemo<ModalAction[]>(() => {
    if (rightActions?.length) return rightActions;

    return [
      {
        id: "default-close",
        label: "閉じる",
        onClick: handleCancel,
        variant: "default",
      },
    ];
  }, [rightActions, handleCancel]);

  if (!modalRoot) {
    return null;
  }

  const message = config?.message ?? null;
  const messageType = message?.type ?? "info";
  const messageClass =
    styles.messageTypes[messageType] ?? styles.messageTypes.info;

  return (
    <Dialog.Root
      open={isOpen && Boolean(content)}
      disablePointerDismissal={isProcessing}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Portal container={modalRoot}>
        <Dialog.Backdrop className={styles.overlay} />

        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup
            finalFocus={false}
            className={styles.modalWindow}
            style={popupStyle}
          >
            <header className={styles.header}>
              <Dialog.Title className={styles.title}>
                {config?.title ?? ""}
              </Dialog.Title>

              <CloseButton onClick={handleCancel} disabled={isProcessing} />
            </header>

            {message && (
              <div className={clsx(styles.messageBanner, messageClass)}>
                {message.text}
              </div>
            )}

            <main className={styles.body}>{content}</main>

            {!config?.hideFooter && (
              <footer className={styles.footer}>
                {config?.footerContent ?? (
                  <div className={styles.footerContainer}>
                    <div className={styles.footerRight}>
                      {computedRightActions.map((action) => (
                        <ActionButton
                          key={action.id}
                          variant={action.variant ?? "default"}
                          onClick={action.onClick}
                          disabled={action.disabled || isProcessing}
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
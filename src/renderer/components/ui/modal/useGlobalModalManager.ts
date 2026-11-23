// src/renderer/components/ui/modal/useGlobalModalManager.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import { MODAL_SIZES, type ModalAction } from "@shared/types/ui/modal";
import * as styles from "./globalModalManager.css";

export function useGlobalModalManager() {
  const { isOpen, content, config, closeModal } = useAppStore(
    useShallow((state) => ({
      isOpen: state.modal.isOpen,
      content: state.modal.content,
      config: state.modal.config,
      closeModal: state.closeGlobalModal,
    })),
  );

  const handleCancel = useCallback(() => {
    config?.onCancel?.();
    closeModal();
  }, [config, closeModal]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel],
  );

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  const width = config?.width ?? MODAL_SIZES.DEFAULT.width;
  const height = config?.height ?? MODAL_SIZES.DEFAULT.height;
  const popupStyle = useMemo(() => ({ width, height }), [width, height]);

  const rightActions = config?.rightActions;
  const isProcessing = config?.isProcessing ?? false;

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

  const message = config?.message ?? null;
  const messageType = message?.type ?? "info";
  const messageClass =
    styles.messageTypes[messageType] ?? styles.messageTypes.info;

  return {
    state: {
      isOpen: isOpen && Boolean(content),
      content,
      title: config?.title ?? "",
      message,
      messageClass,
      modalRoot,
      popupStyle,
      rightActions: computedRightActions,
      footerContent: config?.footerContent,
      hideFooter: config?.hideFooter ?? false,
      isProcessing,
    },
    actions: {
      handleOpenChange,
      handleCancel,
    },
  };
}
// src/renderer/components/ui/modal/useGlobalModalManager.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";

import type { ModalAction } from "@shared/types/ui/modal";

const DEFAULT_MODAL_SIZE = {
  width: "min(85vw, 850px)",
  height: "min(75vh, 650px)",
};

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

  const handleConfirm = useCallback(async () => {
    await config?.onConfirm?.();
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleCancel]);

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  const width = config?.width ?? DEFAULT_MODAL_SIZE.width;
  const height = config?.height ?? DEFAULT_MODAL_SIZE.height;

  const rightActions = config?.rightActions;
  const confirmText = config?.confirmText;
  const cancelText = config?.cancelText;
  const isConfirmDisabled = config?.isConfirmDisabled;
  const isProcessing = config?.isProcessing;

  const computedRightActions = useMemo<ModalAction[]>(() => {
    if (rightActions?.length) {
      return rightActions;
    }

    if (confirmText || cancelText) {
      const actions: ModalAction[] = [
        {
          id: "cancel",
          label: cancelText ?? "キャンセル",
          onClick: handleCancel,
          variant: "default",
        },
      ];

      if (confirmText) {
        actions.push({
          id: "confirm",
          label: isProcessing ? "処理中..." : confirmText,
          onClick: handleConfirm,
          disabled: isConfirmDisabled || isProcessing,
          variant: "default",
        });
      }

      return actions;
    }

    return [
      {
        id: "default-close",
        label: "閉じる",
        onClick: handleCancel,
        variant: "default",
      },
    ];
  }, [
    rightActions,
    confirmText,
    cancelText,
    isConfirmDisabled,
    isProcessing,
    handleCancel,
    handleConfirm,
  ]);

  return {
    state: {
      isOpen,
      content,
      title: config?.title ?? "",
      message: config?.message ?? null,
      modalRoot,
      dimensions: { width, height },
      leftActions: config?.leftActions ?? [],
      rightActions: computedRightActions,
      footerContent: config?.footerContent,
      hideFooter: config?.hideFooter ?? false,
      isProcessing: config?.isProcessing ?? false,
    },
    actions: {
      closeModal,
      handleConfirm,
      handleCancel,
    },
  };
}

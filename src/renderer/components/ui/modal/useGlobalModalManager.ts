// src/renderer/components/ui/modal/useGlobalModalManager.ts

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { ModalSize } from "@shared/types/ui";

const DEFAULT_MODAL_SIZE: Required<ModalSize> = {
  width: "min(85vw, 850px)",
  height: "min(75vh, 650px)",
} as const;

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
    if (config?.onCancel) {
      config.onCancel();
    }
    closeModal();
  }, [config, closeModal]);

  const handleConfirm = useCallback(async () => {
    if (config?.onConfirm) {
      await config.onConfirm();
    }
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCancel]);

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  const width = config?.width ?? DEFAULT_MODAL_SIZE.width;
  const height = config?.height ?? DEFAULT_MODAL_SIZE.height;

  return {
    state: {
      isOpen,
      content,
      title: config?.title ?? "",
      message: config?.message ?? null,
      modalRoot,
      dimensions: { width, height },
      footerContent: config?.footerContent,
      hideFooter: config?.hideFooter ?? false,
      confirmText: config?.confirmText ?? "はい",
      cancelText: config?.cancelText ?? "いいえ",
      isConfirmDisabled: config?.isConfirmDisabled ?? false,
      isProcessing: config?.isProcessing ?? false,
    },
    actions: {
      closeModal,
      handleConfirm,
      handleCancel,
    },
  };
}

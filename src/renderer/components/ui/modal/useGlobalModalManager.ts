// src/renderer/components/ui/modal/useGlobalModalManager.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { ModalAction, ModalSize } from "@shared/types/ui/modal";

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

  // 🎯 右側アクションの自動補完ロジック
  const computedRightActions = useMemo<ModalAction[]>(() => {
    if (config?.rightActions && config.rightActions.length > 0) {
      return config.rightActions;
    }

    // 後方互換性（confirmText / cancelText 指定時）
    if (config?.confirmText || config?.cancelText) {
      const actionsList: ModalAction[] = [];
      actionsList.push({
        id: "cancel",
        label: config.cancelText ?? "キャンセル",
        onClick: handleCancel,
        variant: "default",
      });
      if (config.confirmText) {
        actionsList.push({
          id: "confirm",
          label: config.isProcessing ? "処理中..." : config.confirmText,
          onClick: handleConfirm,
          disabled: config.isConfirmDisabled || config.isProcessing,
          variant: "default",
        });
      }
      return actionsList;
    }

    // デフォルト: 「閉じる」ボタン単体
    return [
      {
        id: "default-close",
        label: "閉じる",
        onClick: handleCancel,
        variant: "default",
      },
    ];
  }, [
    config?.rightActions,
    config?.confirmText,
    config?.cancelText,
    config?.isConfirmDisabled,
    config?.isProcessing,
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

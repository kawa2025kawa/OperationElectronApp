// src/renderer/features/other/components/modal/contents/resetStatus/useResetStatusModalContent.ts

import { useCallback, useEffect } from "react";
import { useAppStore } from "@renderer/store";

export function useResetStatusModalContent() {
  const updateModalConfig = useAppStore((state) => state.updateModalConfig);
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const resetAllOperationStatuses = useAppStore(
    (state) => state.resetAllOperationStatuses,
  );

  const handleReset = useCallback(async () => {
    updateModalConfig({ isProcessing: true });
    try {
      await resetAllOperationStatuses();
      closeGlobalModal();
    } catch (error) {
      console.error("Failed to reset operation statuses:", error);
      updateModalConfig({
        isProcessing: false,
        message: {
          text: "ステータスのリセット中にエラーが発生しました。",
          type: "error",
        },
      });
    }
  }, [resetAllOperationStatuses, closeGlobalModal, updateModalConfig]);

  useEffect(() => {
    updateModalConfig({
      message: undefined,
      rightActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: closeGlobalModal,
        },
        {
          id: "execute",
          label: "リセット実行",
          onClick: handleReset,
          variant: "default",
        },
      ],
    });
  }, [closeGlobalModal, handleReset, updateModalConfig]);

  return {};
}

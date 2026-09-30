// src/renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { giftMdService } from "@renderer/features/other/services/giftMdService";

import { useAppStore } from "@renderer/store";

export function useGiftMdModalContent() {
  const {
    giftFile,
    isProcessing,
    setGiftMdFileFromRaw,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      giftFile: state.giftMd.selectedFile,
      isProcessing: state.giftMd.isProcessing,
      setGiftMdFileFromRaw: state.setGiftMdFileFromRaw,
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const files = useMemo(() => (giftFile ? [giftFile] : []), [giftFile]);

  const handleExecute = useCallback(async () => {
    if (!giftFile) {
      updateModalConfig({
        message: {
          text: "エラーログファイルを選択してください。",
          type: "warning",
        },
      });
      return;
    }

    updateModalConfig({
      isProcessing: true,
      message: null,
    });

    try {
      const message = await giftMdService.process(giftFile.path);

      updateModalConfig({
        message: {
          text: message,
          type: "success",
        },
      });
    } catch (error) {
      console.error("[useGiftMdModalContent] Process error:", error);

      updateModalConfig({
        message: {
          text:
            error instanceof Error
              ? error.message
              : "処理中にエラーが発生しました。",
          type: "error",
        },
      });
    } finally {
      updateModalConfig({
        isProcessing: false,
      });
    }
  }, [giftFile, updateModalConfig]);

  useEffect(() => {
    updateModalConfig({
      rightActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: closeGlobalModal,
          disabled: isProcessing,
        },
        {
          id: "execute",
          label: isProcessing ? "処理中..." : "転送実行",
          onClick: handleExecute,
          disabled: !giftFile || isProcessing,
          variant: "default",
        },
      ],
    });
  }, [
    giftFile,
    isProcessing,
    handleExecute,
    updateModalConfig,
    closeGlobalModal,
  ]);

  return {
    files,
    isProcessing,
    setGiftMdFileFromRaw,
  };
}

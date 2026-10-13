import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { trpc } from "@renderer/lib/trpc";
import { useAppStore } from "@renderer/store";

export function useGiftMdModalContent() {
  const {
    giftFile,
    isProcessing,
    infoMessage,
    setGiftMdFileFromRaw,
    setGiftMdProcessing,
    setGiftMdMessage,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      giftFile: state.giftMd.selectedFile,
      isProcessing: state.giftMd.isProcessing,
      infoMessage: state.giftMd.infoMessage,
      setGiftMdFileFromRaw: state.setGiftMdFileFromRaw,
      setGiftMdProcessing: state.setGiftMdProcessing,
      setGiftMdMessage: state.setGiftMdMessage,
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const files = giftFile ? [giftFile] : [];

  const handleExecute = useCallback(async () => {
    if (!giftFile) {
      setGiftMdMessage({
        text: "処理対象のファイルを選択してください。",
        type: "warning",
      });
      return;
    }

    setGiftMdProcessing(true);
    setGiftMdMessage({
      text: "ギフトデータの処理を実行しています...",
      type: "info",
    });

    try {
      const message = await trpc.other.processGiftMd.mutate(giftFile.path);
      setGiftMdMessage({
        text: message || "ギフトデータの処理が正常に完了しました。",
        type: "success",
      });
    } catch (error) {
      console.error("[useGiftMdModalContent] Process error:", error);
      setGiftMdMessage({
        text:
          error instanceof Error
            ? error.message
            : "ギフトデータの処理中にエラーが発生しました。",
        type: "error",
      });
    } finally {
      setGiftMdProcessing(false);
    }
  }, [giftFile, setGiftMdProcessing, setGiftMdMessage]);

  useEffect(() => {
    updateModalConfig({
      message: infoMessage,
      rightActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: closeGlobalModal,
          disabled: isProcessing,
        },
        {
          id: "execute",
          label: isProcessing ? "処理中..." : "実行",
          onClick: handleExecute,
          disabled: !giftFile || isProcessing,
          variant: "default",
        },
      ],
    });
  }, [
    infoMessage,
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

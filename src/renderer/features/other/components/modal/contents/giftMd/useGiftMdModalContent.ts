// src/renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";

export function useGiftMdModalContent() {
  const { giftFile, isProcessing, setGiftMdFileFromRaw, updateModalConfig } =
    useAppStore(
      useShallow((s) => ({
        giftFile: s.giftMd.selectedFile,
        isProcessing: s.giftMd.isProcessing,
        setGiftMdFileFromRaw: s.setGiftMdFileFromRaw,
        updateModalConfig: s.updateModalConfig,
      })),
    );

  const files = useMemo(() => (giftFile ? [giftFile] : []), [giftFile]);

  // 🎯 転送実行処理
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

    // 1. ローディング表示 ON & 既存メッセージ消去
    updateModalConfig({ isProcessing: true, message: null });

    try {
      // 2. Main プロセスの giftMdProcess を IPC 経由で呼び出し
      const message = await commands.processGiftMd(giftFile.path);

      // 3. 成功メッセージをモーダル上部に表示
      updateModalConfig({
        message: {
          text: message,
          type: "success",
        },
      });
    } catch (error) {
      console.error("[GiftMdModal] Process error:", error);
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
      // 4. ローディング解除
      updateModalConfig({ isProcessing: false });
    }
  }, [giftFile, updateModalConfig]);

  return {
    state: {
      files,
      hasFile: Boolean(giftFile),
      isProcessing,
    },
    actions: {
      setGiftMdFileFromRaw,
      handleExecute,
    },
  };
}

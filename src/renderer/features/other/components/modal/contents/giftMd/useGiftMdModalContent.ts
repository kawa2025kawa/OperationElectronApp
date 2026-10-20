// src/renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useAppStore } from "@renderer/store";
import { getFileName } from "@shared/utils/fileUtils";
import type {
  GiftMdFile,
  GiftMessage,
} from "@renderer/features/other/types/giftMdTypes";
import { otherIpcService } from "@renderer/services/otherIpcService";

const DEFAULT_INFO_MESSAGE: GiftMessage = {
  text: "処理対象のギフトデータファイル (.txt, .DAT) をドラッグ＆ドロップしてください。",
  type: "info",
};

// ギフトMD処理モーダルのローカル状態および実行ロジックを管理するフック。
export function useGiftMdModalContent() {
  const { updateModalConfig, closeGlobalModal } = useAppStore(
    useShallow((state) => ({
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const [giftFile, setGiftFile] = useState<GiftMdFile | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] =
    useState<GiftMessage>(DEFAULT_INFO_MESSAGE);

  // 選択されたファイル配列からギフトファイルパス・名前を抽出しローカル状態に保持する。
  const setGiftMdFileFromRaw = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    const file = rawFiles[0];
    const path =
      window.electronAPI.getFilePath(file) ||
      ("path" in file && typeof file.path === "string" ? file.path : file.name);
    if (!path) return;

    const fileName = file.name || getFileName(path) || path;

    setGiftFile({
      name: fileName,
      path,
    });
    setInfoMessage({
      text: `選択中のファイル: ${fileName}`,
      type: "info",
    });
  }, []);

  // ギフトMD処理をバックエンドに要求し進捗メッセージを更新する。
  const handleExecute = useCallback(async () => {
    if (!giftFile) {
      setInfoMessage({
        text: "処理対象のファイルを選択してください。",
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);
    setInfoMessage({
      text: "ギフトデータの処理を実行しています...",
      type: "info",
    });

    try {
      const message = await otherIpcService.processGiftMd(giftFile.path);
      setInfoMessage({
        text: message || "ギフトデータの処理が正常に完了しました。",
        type: "success",
      });
    } catch (error) {
      console.error("[useGiftMdModalContent] Process error:", error);
      setInfoMessage({
        text:
          error instanceof Error
            ? error.message
            : "ギフトデータの処理中にエラーが発生しました。",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [giftFile]);

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

  const files = giftFile ? [giftFile] : [];

  return {
    files,
    isProcessing,
    setGiftMdFileFromRaw,
  };
}

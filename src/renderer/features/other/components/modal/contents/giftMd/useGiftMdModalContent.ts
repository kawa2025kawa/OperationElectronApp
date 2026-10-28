// src/renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import type {
  GiftMdFile,
  GiftMessage,
} from "@renderer/features/other/types/giftMdTypes";
import { otherIpcService } from "@renderer/services/otherIpcService";
import { useAppStore } from "@renderer/store";
import { getFileName } from "@shared/utils/fileUtils";

const DEFAULT_INFO_MESSAGE: GiftMessage = {
  text: "処理対象のギフトデータファイル (.txt, .DAT) をドラッグ＆ドロップしてください。",
  type: "info",
};

export function useGiftMdModalContent() {
  const { updateModalConfig, closeGlobalModal } = useAppStore(
    useShallow((state) => ({
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const [giftFile, setGiftFile] = useState<GiftMdFile | null>(null);
  const [infoMessage, setInfoMessage] =
    useState<GiftMessage>(DEFAULT_INFO_MESSAGE);

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

  const handleExecute = useCallback(async () => {
    if (!giftFile) return;

    updateModalConfig({ isProcessing: true });
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
      updateModalConfig({ isProcessing: false });
    }
  }, [giftFile, updateModalConfig]);

  useEffect(() => {
    updateModalConfig({
      message: infoMessage,
      rightActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: closeGlobalModal,
        },
        {
          id: "execute",
          label: "実行",
          onClick: handleExecute,
          disabled: !giftFile,
          variant: "default",
        },
      ],
    });
  }, [
    infoMessage,
    giftFile,
    handleExecute,
    updateModalConfig,
    closeGlobalModal,
  ]);

  return {
    files: giftFile ? [giftFile] : [],
    setGiftMdFileFromRaw,
  };
}

// src/renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent.ts

import { useCallback, useState } from "react";

import type {
  GiftMdFile,
  GiftMessage,
} from "@renderer/features/other/types/giftMdTypes";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { otherIpcService } from "@renderer/services/otherIpcService";
import { toErrorMessage } from "@renderer/utils/errorUtils";
import { toResolvedFileItem } from "@renderer/utils/filePathUtils";

const DEFAULT_INFO_MESSAGE: GiftMessage = {
  text: "処理対象のギフトデータファイル (.txt, .DAT) をドラッグ＆ドロップしてください。",
  type: "info",
};

export function useGiftMdModalContent() {
  const [giftFile, setGiftFile] = useState<GiftMdFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [infoMessage, setInfoMessage] =
    useState<GiftMessage>(DEFAULT_INFO_MESSAGE);

  const setGiftMdFileFromRaw = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;

    const resolved = toResolvedFileItem(rawFiles[0], true);
    if (!resolved) return;

    setGiftFile(resolved);
    setInfoMessage({
      text: `選択中のファイル: ${resolved.name}`,
      type: "info",
    });
  }, []);

  const handleExecute = useCallback(async () => {
    if (!giftFile || isProcessing) return;

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
        text: toErrorMessage(
          error,
          "ギフトデータの処理中にエラーが発生しました。",
        ),
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [giftFile, isProcessing]);

  useModalFooterSync({
    message: infoMessage,
    isProcessing,
    executeLabel: "実行",
    isExecuteDisabled: !giftFile || isProcessing,
    onExecute: handleExecute,
  });

  return {
    files: giftFile ? [giftFile] : [],
    setGiftMdFileFromRaw,
  };
}
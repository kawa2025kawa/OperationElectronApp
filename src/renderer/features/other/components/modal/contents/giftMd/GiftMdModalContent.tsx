// src/renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent.tsx

import { memo, useCallback, useRef, useState } from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { otherIpcService } from "@renderer/services/ipcServices";
import {
  toErrorMessage,
  toResolvedFileItem,
  type ResolvedFileItem,
} from "@renderer/utils/rendererUtils";
import type { GlobalModalComponent } from "@renderer/types/modal";

interface GiftMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const DEFAULT_INFO_MESSAGE: GiftMessage = {
  text: "処理対象のギフトデータファイル (.txt, .DAT) をドラッグ＆ドロップしてください。",
  type: "info",
};

export const GiftMdModalContent: GlobalModalComponent = memo(() => {
  const [giftFile, setGiftFile] = useState<ResolvedFileItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [infoMessage, setInfoMessage] =
    useState<GiftMessage>(DEFAULT_INFO_MESSAGE);
  const isProcessingRef = useRef(false);

  const setGiftMdFileFromRaw = useCallback((rawFiles: File[]) => {
    if (isProcessingRef.current || rawFiles.length === 0) return;

    const resolved = toResolvedFileItem(rawFiles[0], true);
    if (!resolved) return;

    setGiftFile(resolved);
    setInfoMessage({
      text: `選択中のファイル: ${resolved.name}`,
      type: "info",
    });
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (isProcessingRef.current) return;
    setGiftFile(null);
    setInfoMessage(DEFAULT_INFO_MESSAGE);
  }, []);

  const handleExecute = useCallback(async () => {
    if (!giftFile || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setInfoMessage({
      text: "ギフトデータの処理を実行しています...",
      type: "info",
    });

    try {
      const message = await otherIpcService.processGiftMd(giftFile.path);
      setGiftFile(null);
      setInfoMessage({
        text: message || "ギフトデータの処理が正常に完了しました。",
        type: "success",
      });
    } catch (error) {
      console.error("[GiftMdModalContent] Process error:", error);
      setInfoMessage({
        text: toErrorMessage(
          error,
          "ギフトデータの処理中にエラーが発生しました。",
        ),
        type: "error",
      });
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [giftFile]);

  useModalFooterSync({
    message: infoMessage,
    isProcessing,
    isCancelDisabled: isProcessing,
    executeLabel: isProcessing ? "実行中..." : "実行",
    isExecuteDisabled: !giftFile || isProcessing,
    onExecute: handleExecute,
  });

  return (
    <FileDropZone
      files={giftFile ? [giftFile] : []}
      accept=".txt,.DAT,text/plain"
      label="ギフトデータファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={isProcessing}
      onFileSelect={setGiftMdFileFromRaw}
      onRemoveFile={handleRemoveFile}
    />
  );
});

GiftMdModalContent.displayName = "GiftMdModalContent";
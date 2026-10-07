// src/renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent.tsx

import { memo } from "react";

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

import { useGiftMdModalContent } from "./useGiftMdModalContent";

export const GiftMdModalContent: GlobalModalComponent = memo(() => {
  const { files, isProcessing, setGiftMdFileFromRaw } = useGiftMdModalContent();

  return (
    <FileDropZone
      files={files}
      accept=".txt,.DAT,text/plain"
      label="エラーログファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={isProcessing}
      onFileSelect={setGiftMdFileFromRaw}
    />
  );
});

GiftMdModalContent.displayName = "GiftMdModalContent";

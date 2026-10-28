// src/renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent.tsx

import { memo } from "react";

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useGiftMdModalContent } from "@renderer/features/other/components/modal/contents/giftMd/useGiftMdModalContent";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

export const GiftMdModalContent: GlobalModalComponent = memo(() => {
  const { files, setGiftMdFileFromRaw } = useGiftMdModalContent();

  return (
    <FileDropZone
      files={files}
      accept=".txt,.DAT,text/plain"
      label="ギフトデータファイルをドラッグ＆ドロップ または クリックして選択"
      onFileSelect={setGiftMdFileFromRaw}
    />
  );
});

GiftMdModalContent.displayName = "GiftMdModalContent";

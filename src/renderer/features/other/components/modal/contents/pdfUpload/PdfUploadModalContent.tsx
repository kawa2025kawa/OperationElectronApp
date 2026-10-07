// src/renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent.tsx

import { memo } from "react";

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

import { usePdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent";

export const PdfUploadModalContent: GlobalModalComponent = memo(() => {
  const { files, isProcessing, addPdfFiles, handleFileReorder } =
    usePdfUploadModalContent();

  return (
    <FileDropZone
      files={files}
      accept=".pdf,application/pdf"
      label="PDFファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={isProcessing}
      onFileSelect={addPdfFiles}
      onReorderFile={handleFileReorder}
    />
  );
});

PdfUploadModalContent.displayName = "PdfUploadModalContent";

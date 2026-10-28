// src/renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent.tsx

import { memo } from "react";

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { usePdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

export const PdfUploadModalContent: GlobalModalComponent = memo(() => {
  const { files, addPdfFiles, handleFileReorder, handleRemoveFile } =
    usePdfUploadModalContent();

  return (
    <FileDropZone
      files={files}
      accept=".pdf,application/pdf"
      label="PDFファイルをドラッグ＆ドロップ または クリックして選択"
      onFileSelect={addPdfFiles}
      onReorderFile={handleFileReorder}
      onRemoveFile={handleRemoveFile}
    />
  );
});

PdfUploadModalContent.displayName = "PdfUploadModalContent";

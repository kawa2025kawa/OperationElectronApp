// src/renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent.tsx

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { usePdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent";

import type { GlobalModalComponent } from "@shared/types/ui/modal";

export const PdfUploadModalContent: GlobalModalComponent = () => {
  const {
    files,
    isBusy,
    addPdfFiles,
    handleRenameFile,
    handleFileReorder,
    handleRemoveFile,
  } = usePdfUploadModalContent();

  return (
    <FileDropZone
      files={files}
      accept=".pdf,application/pdf"
      label="PDFファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={isBusy}
      onFileSelect={addPdfFiles}
      onRenameFile={handleRenameFile}
      onReorderFile={handleFileReorder}
      onRemoveFile={handleRemoveFile}
    />
  );
};

PdfUploadModalContent.displayName = "PdfUploadModalContent";

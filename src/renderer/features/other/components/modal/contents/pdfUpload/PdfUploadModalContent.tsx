// src/renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent.tsx

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { usePdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

export const PdfUploadModalContent: GlobalModalComponent = () => {
  const {
    files,
    addPdfFiles,
    handleRenameFile,
    handleFileReorder,
    handleRemoveFile,
  } = usePdfUploadModalContent();

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <FileDropZone
        files={files}
        accept=".pdf,application/pdf"
        label="PDFファイルをドラッグ＆ドロップ または クリックして選択"
        onFileSelect={addPdfFiles}
        onRenameFile={handleRenameFile}
        onReorderFile={handleFileReorder}
        onRemoveFile={handleRemoveFile}
      />
    </div>
  );
};

PdfUploadModalContent.displayName = "PdfUploadModalContent";

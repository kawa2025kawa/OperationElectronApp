// src/renderer/features/operation/components/modal/pdfUploadModal/PdfUploadModalContent.tsx

import React, { useEffect } from "react";
import { clsx } from "clsx";

import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import * as sharedStyles from "@renderer/features/operation/components/modal/operationModal.css";

import type { ModalContentProps } from "../useOperationModalLogic";
import {
  type PdfUploadFile,
  usePdfUploadModalLogic,
} from "./usePdfUploadModalLogic";
import * as styles from "./pdfUploadModalContent.css";

const PDF_ACCEPT = "application/pdf,.pdf";
const ERROR_MESSAGE = "PDFのアップロード処理に失敗しました。";

// ============================================================
// File Item
// ============================================================

interface FileItemProps {
  file: PdfUploadFile;
  index: number;
  isLast: boolean;
  isProcessing: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  index,
  isLast,
  isProcessing,
  onMoveUp,
  onMoveDown,
}) => {
  const isFirst = index === 0;

  return (
    <div className={styles.itemCardRow}>
      <div className={styles.fileContent}>
        <div className={styles.fileNameRow}>
          <span className={styles.fileIndex}>{index + 1}.</span>
          <span className={styles.fileName}>{file.name}</span>
        </div>

        <span className={styles.filePath}>{file.path}</span>
      </div>

      <div className={styles.reorderButtons}>
        <button
          type="button"
          className={styles.reorderButton}
          onClick={() => onMoveUp(index)}
          disabled={isFirst || isProcessing}
          aria-label={`${index + 1}番目のファイルを上へ移動`}
        >
          ↑
        </button>

        <button
          type="button"
          className={styles.reorderButton}
          onClick={() => onMoveDown(index)}
          disabled={isLast || isProcessing}
          aria-label={`${index + 1}番目のファイルを下へ移動`}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Drop Zone
// ============================================================

interface DropZoneProps {
  isDragging: boolean;
  isProcessing: boolean;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDragLeave: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const DropZone: React.FC<DropZoneProps> = ({
  isDragging,
  isProcessing,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
}) => (
  <div
    className={clsx(
      styles.dropZone,
      isDragging && styles.dropZoneDragging,
      isProcessing && styles.dropZoneDisabled,
    )}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <label className={styles.dropZoneLabel}>
      <p className={styles.dropZoneTitle}>PDFファイルをここにドロップ</p>

      <p className={styles.dropZoneDescription}>
        またはクリックしてファイルを選択
      </p>

      <input
        type="file"
        accept={PDF_ACCEPT}
        multiple
        disabled={isProcessing}
        onChange={onChange}
        className={styles.hiddenFileInput}
      />
    </label>
  </div>
);

// ============================================================
// File List
// ============================================================

interface FileListProps {
  files: PdfUploadFile[];
  isProcessing: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  isProcessing,
  onMoveUp,
  onMoveDown,
}) => {
  if (files.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <span className={styles.emptyText}>NO DATA</span>
      </div>
    );
  }

  return (
    <>
      {files.map((file, index) => (
        <FileItem
          key={`${file.path}-${index}`}
          file={file}
          index={index}
          isLast={index === files.length - 1}
          isProcessing={isProcessing}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      ))}
    </>
  );
};

// ============================================================
// Main
// ============================================================

export const PdfUploadModalContent: React.FC<ModalContentProps> = React.memo(
  ({ onClose, registerPrimaryAction }) => {
    const {
      files,
      fileCount,
      isProcessing,
      errorMessage,
      currentViewKey,
      isDragging,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleFileChange,
      handleMoveUp,
      handleMoveDown,
      handleExecute,
      handleRetry,
      handleCancelAndClose,
    } = usePdfUploadModalLogic(onClose);

    useEffect(() => {
      let action: (() => void) | undefined;

      if (currentViewKey === "success") {
        action = handleCancelAndClose;
      } else if (currentViewKey === "dnd" && !isProcessing) {
        action = handleExecute;
      } else if (currentViewKey === "error") {
        action = handleRetry;
      }

      registerPrimaryAction(action);

      return () => {
        registerPrimaryAction(undefined);
      };
    }, [
      currentViewKey,
      isProcessing,
      handleExecute,
      handleRetry,
      handleCancelAndClose,
      registerPrimaryAction,
    ]);

    if (currentViewKey === "success") {
      return (
        <div className={sharedStyles.contentFlexContainer}>
          <h2>アップロード完了</h2>
          <p>{fileCount} 件のファイルを処理しました。</p>
        </div>
      );
    }

    if (currentViewKey === "error") {
      return (
        <ErrorState
          errorMessage={errorMessage || ERROR_MESSAGE}
          onClickRetry={handleRetry}
        />
      );
    }

    return (
      <div className={sharedStyles.contentFlexContainer}>
        <DropZone
          isDragging={isDragging}
          isProcessing={isProcessing}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onChange={handleFileChange}
        />

        <div className={styles.bottomSection}>
          <div className={sharedStyles.sectionTitle}>
            選択中のファイル ({fileCount})
          </div>

          <div className={styles.listBox}>
            <FileList
              files={files}
              isProcessing={isProcessing}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
        </div>
      </div>
    );
  },
);

PdfUploadModalContent.displayName = "PdfUploadModalContent";

export default PdfUploadModalContent;

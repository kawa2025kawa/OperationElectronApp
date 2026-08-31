// src/renderer/features/other/components/modal/pdfUploadModal/PdfUploadModalContent.tsx

import React, {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { getFileName } from "@shared/utils/fileUtils";
import * as styles from "./pdfUploadModalContent.css";

const PDF_ACCEPT = "application/pdf,.pdf";
const ERROR_MESSAGE = "PDFアップロード処理中にエラーが発生しました。";

export type ViewKey = "dnd" | "success" | "error";

export interface PdfUploadFile {
  name: string;
  path: string;
}

interface PdfUploadModalContentProps {
  onClose: () => void;
}

export const PdfUploadModalContent: React.FC<PdfUploadModalContentProps> =
  React.memo(({ onClose }) => {
    const {
      storeFiles,
      isProcessing,
      errorMessage,
      mergePdfFiles,
      reorderPdfFiles,
      uploadPdfFiles,
      resetPdfUpload,
    } = useAppStore(
      useShallow((state) => ({
        storeFiles: state.pdfUpload.files,
        isProcessing: state.pdfUpload.isProcessing,
        errorMessage: state.pdfUpload.errorMessage,
        mergePdfFiles: state.mergePdfFiles,
        reorderPdfFiles: state.reorderPdfFiles,
        uploadPdfFiles: state.uploadPdfFiles,
        resetPdfUpload: state.resetPdfUpload,
      })),
    );

    const [currentViewKey, setCurrentViewKey] = useState<ViewKey>("dnd");
    const [isDragging, setIsDragging] = useState(false);

    const files = useMemo<PdfUploadFile[]>(
      () =>
        storeFiles.map((file) => ({
          name: file.name || getFileName(file.path) || "ファイル名不明",
          path: file.path,
        })),
      [storeFiles],
    );

    const fileCount = files.length;

    const selectFiles = useCallback(
      (selectedFiles: File[]) => {
        if (isProcessing || selectedFiles.length === 0) return;

        const filePaths = selectedFiles
          .map(
            (file) =>
              commands.getFilePath(file) ||
              ("path" in file && typeof file.path === "string"
                ? file.path
                : file.name),
          )
          .filter(Boolean);

        if (filePaths.length === 0) return;

        mergePdfFiles(filePaths);
        setCurrentViewKey("dnd");
      },
      [isProcessing, mergePdfFiles],
    );

    const handleDragOver = useCallback(
      (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!isProcessing) {
          setIsDragging(true);
        }
      },
      [isProcessing],
    );

    const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
      (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (isProcessing) return;

        const pdfFiles = Array.from(event.dataTransfer.files).filter(
          (file) =>
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf"),
        );

        selectFiles(pdfFiles);
      },
      [isProcessing, selectFiles],
    );

    const handleFileChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        selectFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
      },
      [selectFiles],
    );

    const handleMoveUp = useCallback(
      (index: number) => {
        if (isProcessing || index <= 0) return;
        reorderPdfFiles(index, index - 1);
      },
      [isProcessing, reorderPdfFiles],
    );

    const handleMoveDown = useCallback(
      (index: number) => {
        if (isProcessing || index >= fileCount - 1) return;
        reorderPdfFiles(index, index + 1);
      },
      [fileCount, isProcessing, reorderPdfFiles],
    );

    const handleExecute = useCallback(async () => {
      if (isProcessing || fileCount === 0) return;

      try {
        await uploadPdfFiles();
        setCurrentViewKey("success");
      } catch (error) {
        console.error("[PdfUploadModal] uploadPdfFiles error:", error);
        setCurrentViewKey("error");
      }
    }, [fileCount, isProcessing, uploadPdfFiles]);

    const handleRetry = useCallback(() => {
      resetPdfUpload();
      setCurrentViewKey("dnd");
    }, [resetPdfUpload]);

    const handleCancelAndClose = useCallback(() => {
      resetPdfUpload();
      setCurrentViewKey("dnd");
      setIsDragging(false);
      onClose();
    }, [onClose, resetPdfUpload]);

    const isSuccess = currentViewKey === "success";

    return (
      <div className={styles.modalContainer}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>
            {isSuccess ? "アップロード完了" : "Tempomatic PDFアップロード"}
          </h2>
          {!isSuccess && <CloseButton onClick={handleCancelAndClose} />}
        </header>

        {/* Main Content */}
        <main className={styles.contentFlexContainer}>
          {currentViewKey === "success" && (
            <div>
              <h2>処理が完了しました</h2>
              <p>{fileCount} 件のPDFファイルをアップロードしました。</p>
            </div>
          )}

          {currentViewKey === "error" && (
            <ErrorState
              errorMessage={errorMessage || ERROR_MESSAGE}
              onClickRetry={handleRetry}
            />
          )}

          {currentViewKey === "dnd" && (
            <>
              {/* Drop Zone */}
              <div
                className={clsx(
                  styles.dropZone,
                  isDragging && styles.dropZoneDragging,
                  isProcessing && styles.dropZoneDisabled,
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label className={styles.dropZoneLabel}>
                  <p className={styles.dropZoneTitle}>PDFファイルをドロップ</p>
                  <p className={styles.dropZoneDescription}>
                    またはクリックしてファイルを選択
                  </p>
                  <input
                    type="file"
                    accept={PDF_ACCEPT}
                    multiple
                    disabled={isProcessing}
                    onChange={handleFileChange}
                    className={styles.hiddenFileInput}
                  />
                </label>
              </div>

              {/* File List */}
              <div className={styles.bottomSection}>
                <div className={styles.sectionTitle}>
                  対象ファイル一覧 ({fileCount})
                </div>
                <div className={styles.listBox}>
                  {files.length === 0 ? (
                    <div className={styles.emptyContainer}>
                      <span className={styles.emptyText}>NO DATA</span>
                    </div>
                  ) : (
                    files.map((file, index) => (
                      <div
                        key={`${file.path}-${index}`}
                        className={styles.itemCardRow}
                      >
                        <div className={styles.fileContent}>
                          <div className={styles.fileNameRow}>
                            <span className={styles.fileIndex}>
                              {index + 1}.
                            </span>
                            <span className={styles.fileName}>{file.name}</span>
                          </div>
                          <span className={styles.filePath}>{file.path}</span>
                        </div>
                        <div className={styles.reorderButtons}>
                          <button
                            type="button"
                            className={styles.reorderButton}
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || isProcessing}
                            aria-label="上に移動"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className={styles.reorderButton}
                            onClick={() => handleMoveDown(index)}
                            disabled={
                              index === files.length - 1 || isProcessing
                            }
                            aria-label="下に移動"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          {currentViewKey === "success" ? (
            <button
              type="button"
              className={styles.button}
              onClick={handleCancelAndClose}
            >
              OK
            </button>
          ) : currentViewKey === "error" ? (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={handleCancelAndClose}
              >
                閉じる
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={handleRetry}
              >
                再試行
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={handleCancelAndClose}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={handleExecute}
                disabled={fileCount === 0 || isProcessing}
              >
                実行
              </button>
            </>
          )}
        </footer>
      </div>
    );
  });

PdfUploadModalContent.displayName = "PdfUploadModalContent";

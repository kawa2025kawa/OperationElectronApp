// src/renderer/features/operation/components/modal/contents/pdfUploadModal/PdfUploadModalContent.tsx

import React, { useEffect } from "react";
import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import { DropArea } from "@renderer/components/ui/dropArea/DropArea";
import { usePdfUploadModalLogic } from "./usePdfUploadModalLogic";
import type { ModalContentProps } from "../../OperationModal";
import * as sharedStyles from "@renderer/features/operation/components/modal/operationModal.css";
import * as styles from "./pdfUploadModalContent.css";

export const PdfUploadModalContent: React.FC<ModalContentProps> = React.memo(
  ({ onClose, setFooterConfig }) => {
    const {
      pdfUpload,
      currentViewKey,
      isHovering,
      handleMoveUp,
      handleMoveDown,
      handleExecute,
      handleRetry,
      handleCancelAndClose,
      handleFilesSelect,
    } = usePdfUploadModalLogic(onClose);

    const files = pdfUpload.files;
    const fileCount = files.length;
    const isProcessing = pdfUpload.isProcessing;

    useEffect(() => {
      switch (currentViewKey) {
        case "success":
          setFooterConfig({
            primaryText: "完了",
            onPrimary: handleCancelAndClose,
            hidePrimary: false,
          });
          break;

        case "error":
          setFooterConfig({
            hidePrimary: true,
          });
          break;

        case "dnd":
          setFooterConfig({
            primaryText: isProcessing
              ? "処理中..."
              : `アップロード開始 (${fileCount})`,
            primaryDisabled: fileCount === 0 || isProcessing,
            onPrimary: handleExecute,
            hidePrimary: false,
          });
          break;

        default:
          setFooterConfig({
            hidePrimary: true,
          });
      }
    }, [
      currentViewKey,
      fileCount,
      isProcessing,
      handleCancelAndClose,
      handleExecute,
      setFooterConfig,
    ]);

    return (
      <>
        {currentViewKey === "success" && (
          <div className={sharedStyles.contentFlexContainer}>
            <h2>アップロード完了</h2>
            <p>{fileCount} 件のファイルを処理しました。</p>
          </div>
        )}

        {currentViewKey === "error" && (
          <ErrorState
            errorMessage={
              pdfUpload.errorMessage || "PDFのアップロード処理に失敗しました。"
            }
            onClickRetry={handleRetry}
          />
        )}

        {currentViewKey === "dnd" && (
          <div className={sharedStyles.contentFlexContainer}>
            <DropArea
              files={files}
              onDrop={handleFilesSelect}
              isDragging={isHovering}
              accept={{
                "application/pdf": [".pdf"],
              }}
              multiple
              placeholder="PDFファイルをドロップ"
            />

            <div className={styles.bottomSection}>
              <div className={sharedStyles.sectionTitle}>
                選択中のファイル ({fileCount})
              </div>

              <div className={styles.listBox}>
                {fileCount === 0 ? (
                  <div className={styles.emptyContainer}>
                    <span className={styles.emptyText}>NO DATA</span>
                  </div>
                ) : (
                  files.map((file, index) => {
                    const filePath =
                      "path" in file && typeof file.path === "string"
                        ? file.path
                        : "";

                    const isFirst = index === 0;
                    const isLast = index === fileCount - 1;

                    return (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className={styles.itemCardRow}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              minWidth: "24px",
                            }}
                          >
                            {index + 1}.
                          </span>

                          <span className={styles.fileName}>{file.name}</span>
                        </div>

                        <span>:</span>

                        <span className={styles.filePath}>{filePath}</span>

                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            marginLeft: "auto",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={isFirst || isProcessing}
                            style={{
                              opacity: isFirst || isProcessing ? 0.3 : 1,
                            }}
                          >
                            ▲
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={isLast || isProcessing}
                            style={{
                              opacity: isLast || isProcessing ? 0.3 : 1,
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

PdfUploadModalContent.displayName = "PdfUploadModalContent";

export default PdfUploadModalContent;

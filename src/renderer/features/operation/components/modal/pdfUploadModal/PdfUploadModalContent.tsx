// src/renderer/features/operation/components/modal/pdfUploadModal/PdfUploadModalContent.tsx

import React, { useEffect } from "react";
import { DropArea } from "@renderer/components/ui/dropArea/DropArea";
import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import * as sharedStyles from "@renderer/features/operation/components/modal/operationModal.css";
import type { ModalContentProps } from "../useOperationModalLogic";
import { usePdfUploadModalLogic } from "./usePdfUploadModalLogic";
import * as styles from "./pdfUploadModalContent.css";

export const PdfUploadModalContent: React.FC<ModalContentProps> = React.memo(
  ({ onClose, registerPrimaryAction }) => {
    const {
      files,
      fileCount,
      isProcessing,
      errorMessage,
      currentViewKey,
      isHovering,
      handleMoveUp,
      handleMoveDown,
      handleExecute,
      handleRetry,
      handleCancelAndClose,
      handleFilesSelect,
    } = usePdfUploadModalLogic(onClose);

    useEffect(() => {
      switch (currentViewKey) {
        case "success":
          registerPrimaryAction(handleCancelAndClose);

          break;

        case "dnd":
          if (isProcessing) {
            registerPrimaryAction(undefined);
            break;
          }

          registerPrimaryAction(handleExecute);
          break;

        case "error":
          registerPrimaryAction(handleRetry);
          break;

        default:
          registerPrimaryAction(undefined);
          break;
      }

      return () => {
        registerPrimaryAction(undefined);
      };
    }, [
      currentViewKey,
      fileCount,
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
          errorMessage={errorMessage || "PDFのアップロード処理に失敗しました。"}
          onClickRetry={handleRetry}
        />
      );
    }

    return (
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
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={isLast || isProcessing}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  },
);

PdfUploadModalContent.displayName = "PdfUploadModalContent";

export default PdfUploadModalContent;

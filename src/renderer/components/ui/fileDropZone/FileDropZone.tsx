import React from "react";
import { useFileDropZone, type FileDropZoneProps } from "./useFileDropZone";
import * as styles from "./fileDropZone.css";

export const FileDropZone: React.FC<FileDropZoneProps> = React.memo(
  ({
    files = [],
    onFileSelect,
    onReorderFile,
    onRemoveFile,
    accept,
    label = "ファイルをドラッグ＆ドロップ または クリックして選択",
    disabled = false,
  }) => {
    const {
      isDragOver,
      inputRef,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleClick,
      handleKeyDown,
      handleInputChange,
      handleMoveUp,
      handleMoveDown,
      handleRemoveFile,
    } = useFileDropZone({
      files,
      onFileSelect,
      onReorderFile,
      onRemoveFile,
      disabled,
    });

    const stopAnd = (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };

    return (
      <div className={styles.container}>
        {/* ドロップエリア */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          aria-label="クリックでファイル選択"
          onKeyDown={handleKeyDown}
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""} ${disabled ? styles.dropZoneDisabled : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            disabled={disabled}
            onChange={handleInputChange}
            className={styles.hiddenInput}
          />
          <p className={styles.labelText}>{label}</p>
        </div>

        {/* 選択中ファイル一覧 */}
        <div className={styles.selectedFilesContainer}>
          <div className={styles.selectedFilesHeader}>
            選択ファイル ({files.length})
          </div>

          {files.length === 0 ? (
            <div className={styles.emptyFileContainer}>
              <span className={styles.emptyFileText}>NO DATA</span>
            </div>
          ) : (
            <div className={styles.selectedFilesList}>
              {files.map((file, index) => (
                <div
                  key={`${file.path}-${index}`}
                  className={styles.selectedFileRow}
                >
                  <div className={styles.selectedFileContent}>
                    <div className={styles.selectedFileNameRow}>
                      <span className={styles.selectedFileIndex}>
                        {index + 1}.
                      </span>
                      <span
                        className={styles.selectedFileName}
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </div>
                    <span className={styles.selectedFilePath} title={file.path}>
                      {file.path}
                    </span>
                  </div>

                  {/* 操作ボタン群 */}
                  {!disabled && (
                    <div className={styles.actionButtonsRow}>
                      {onReorderFile && (
                        <>
                          <button
                            type="button"
                            className={styles.iconButton}
                            disabled={index === 0}
                            onClick={stopAnd(() => handleMoveUp(index))}
                            title="上に移動"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className={styles.iconButton}
                            disabled={index === files.length - 1}
                            onClick={stopAnd(() => handleMoveDown(index))}
                            title="下に移動"
                          >
                            ▼
                          </button>
                        </>
                      )}
                      {onRemoveFile && (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.removeFileButton}`}
                          onClick={stopAnd(() => handleRemoveFile(index))}
                          aria-label={`${file.name}を取り消す`}
                          title="削除"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

FileDropZone.displayName = "FileDropZone";

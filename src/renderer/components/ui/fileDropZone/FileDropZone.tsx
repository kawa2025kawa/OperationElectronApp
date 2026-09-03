// src/renderer/components/ui/fileDropZone/FileDropZone.tsx

import React from "react";

import {
  useFileDropZone,
  type FileDropZoneItem,
  type FileDropZoneProps,
} from "./useFileDropZone";

import * as styles from "./fileDropZone.css";

// ============================================================================
// Component
// ============================================================================

export const FileDropZone: React.FC<FileDropZoneProps> = React.memo(
  ({
    files = [],
    onFileSelect,
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
      handleRemoveFile,
    } = useFileDropZone({
      onFileSelect,
      onRemoveFile,
      disabled,
    });

    const dropZoneClassName = [
      styles.dropZone,
      isDragOver && styles.dropZoneActive,
      disabled && styles.dropZoneDisabled,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.container}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={dropZoneClassName}
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
              {files.map((file: FileDropZoneItem, index: number) => (
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

                      {!disabled && onRemoveFile && (
                        <button
                          type="button"
                          className={styles.removeFileButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          aria-label={`${file.name}を取り消す`}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <span className={styles.selectedFilePath} title={file.path}>
                      {file.path}
                    </span>
                  </div>
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

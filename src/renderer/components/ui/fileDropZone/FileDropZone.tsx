// src/renderer/components/ui/fileDropZone/FileDropZone.tsx

import { memo, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import * as styles from "./fileDropZone.css";
import {
  ORDER_TIME_OPTIONS,
  type FileDropZoneProps,
} from "./fileDropZoneTypes";
import { useFileDropZone } from "./useFileDropZone";

export const FileDropZone = memo<FileDropZoneProps>(
  ({
    files = [],
    accept,
    label = "PDFファイルをドラッグ＆ドロップ または クリックして選択",
    disabled = false,
    onFileSelect,
    onReorderFile,
    onRemoveFile,
    onRenameFile,
  }) => {
    const {
      isDragOverMain,
      draggedFileIndex,
      dragOverFileIndex,
      mainInputRef,
      handleMainDragOver,
      handleMainDragLeave,
      handleMainDrop,
      handleMainInputChange,
      handleFileDragStart,
      handleFileDragOver,
      handleFileDrop,
      handleFileDragEnd,
      handleRemoveFileItem,
      handleRowSelectRename,
    } = useFileDropZone({
      files,
      disabled,
      onFileSelect,
      onReorderFile,
      onRemoveFile,
      onRenameFile,
    });

    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (openMenuIndex === null) return;

      const handleOutsideClick = (event: globalThis.MouseEvent) => {
        if (!menuContainerRef.current?.contains(event.target as Node)) {
          setOpenMenuIndex(null);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, [openMenuIndex]);

    const stopPropagation = (event: MouseEvent) => event.stopPropagation();

    return (
      <div className={styles.container}>
        <input
          ref={mainInputRef}
          type="file"
          accept={accept}
          multiple
          disabled={disabled}
          onChange={handleMainInputChange}
          className={styles.hiddenInput}
        />

        <div className={styles.selectedFilesHeader}>
          選択ファイル ({files.length})
        </div>

        {files.length === 0 ? (
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={`${styles.unifiedEmptyDropArea} ${isDragOverMain ? styles.unifiedEmptyDropAreaActive : ""}`}
            onDragOver={handleMainDragOver}
            onDragLeave={handleMainDragLeave}
            onDrop={handleMainDrop}
            onClick={() => !disabled && mainInputRef.current?.click()}
          >
            <span className={styles.emptyFilePrimaryText}>{label}</span>
            <span className={styles.emptyFileSubText}>
              （クリックまたはドロップして追加）
            </span>
          </div>
        ) : (
          <div
            className={`${styles.unifiedFilesList} ${isDragOverMain ? styles.unifiedFilesListActive : ""}`}
            onDragOver={handleMainDragOver}
            onDragLeave={handleMainDragLeave}
            onDrop={handleMainDrop}
            onDoubleClick={() => !disabled && mainInputRef.current?.click()}
            title="ダブルクリックまたはドロップでファイルを追加できます"
          >
            {files.map((file, index) => {
              const isDragging = draggedFileIndex === index;
              const isDropTarget = dragOverFileIndex === index;
              const isMenuOpen = openMenuIndex === index;

              const rowClassName = [
                styles.selectedFileRow,
                isDragging && styles.selectedFileRowDragging,
                isDropTarget && styles.selectedFileRowDropTarget,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={`${file.path}-${index}`}
                  className={rowClassName}
                  draggable={!disabled && Boolean(onReorderFile)}
                  onDragStart={(event) => handleFileDragStart(event, index)}
                  onDragOver={(event) => handleFileDragOver(event, index)}
                  onDrop={(event) => handleFileDrop(event, index)}
                  onDragEnd={handleFileDragEnd}
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

                  <div className={styles.rowActions} onClick={stopPropagation}>
                    {onRenameFile && (
                      <div
                        className={styles.dropdownWrapper}
                        ref={isMenuOpen ? menuContainerRef : undefined}
                      >
                        <button
                          type="button"
                          className={styles.dropdownTrigger}
                          onClick={(event) => {
                            stopPropagation(event);
                            setOpenMenuIndex((previous) =>
                              previous === index ? null : index,
                            );
                          }}
                          title="発注エラーリスト名にリネーム"
                        >
                          <span>ファイル名リネーム</span>
                          <span className={styles.dropdownArrow}>▼</span>
                        </button>

                        {isMenuOpen && (
                          <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownList}>
                              {ORDER_TIME_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={(event) => {
                                    stopPropagation(event);
                                    handleRowSelectRename(index, option.value);
                                    setOpenMenuIndex(null);
                                  }}
                                >
                                  {option.value} ({option.timeLabel}発注)
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!disabled && onRemoveFile && (
                      <button
                        type="button"
                        className={styles.removeFileButton}
                        onClick={(event) => {
                          stopPropagation(event);
                          handleRemoveFileItem(index);
                        }}
                        title="削除"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

FileDropZone.displayName = "FileDropZone";

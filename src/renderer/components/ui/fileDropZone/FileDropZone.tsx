// src/renderer/components/ui/fileDropZone/FileDropZone.tsx

import { memo, type SyntheticEvent } from "react";
import { Menu } from "@base-ui/react/menu";
import { clsx } from "clsx";

import { Tooltip } from "@renderer/components/ui/tooltip/Tooltip";

import * as styles from "./fileDropZone.css";
import {
  ORDER_TIME_OPTIONS,
  type FileDropZoneItem,
} from "./fileDropZoneTypes";
import { useFileDropZone } from "./useFileDropZone";

interface FileDropZoneProps {
  files?: FileDropZoneItem[];
  accept?: string;
  label?: string;
  disabled?: boolean;
  onFileSelect: (files: File[]) => void;
  onReorderFile?: (fromIndex: number, toIndex: number) => void;
  onRemoveFile?: (index: number) => void;
  onRenameFile?: (filePath: string, newName: string) => void | Promise<void>;
}

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

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
      openMenuPath,
      mainInputRef,
      handleMenuOpenChange,
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

    const canReorder = Boolean(onReorderFile);
    const canRename = Boolean(onRenameFile);
    const canRemove = Boolean(onRemoveFile);

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
            className={clsx(
              styles.unifiedEmptyDropArea,
              isDragOverMain && "is-active",
            )}
            onDragOver={handleMainDragOver}
            onDragLeave={handleMainDragLeave}
            onDrop={handleMainDrop}
            onClick={() => !disabled && mainInputRef.current?.click()}
          >
            <span className="primary-label">{label}</span>
            <span className="sub-label">
              （クリックまたはドロップして追加）
            </span>
          </div>
        ) : (
          <div
            className={clsx(
              styles.unifiedFilesList,
              isDragOverMain && "is-active",
            )}
            onDragOver={handleMainDragOver}
            onDragLeave={handleMainDragLeave}
            onDrop={handleMainDrop}
            onDoubleClick={() => !disabled && mainInputRef.current?.click()}
            title="ダブルクリックまたはドロップでファイルを追加できます"
          >
            {files.map((file, index) => {
              const isMenuOpen = openMenuPath === file.path;
              const isDragging = draggedFileIndex === index;
              const isDropTarget = dragOverFileIndex === index;

              return (
                <div
                  key={file.path}
                  className={clsx(
                    styles.selectedFileRow,
                    isMenuOpen && "is-open",
                    isDragging && "is-dragging",
                    isDropTarget && "is-drop-target",
                  )}
                  draggable={!disabled && canReorder && !isMenuOpen}
                  onDragStart={(e) => handleFileDragStart(e, index)}
                  onDragOver={(e) => handleFileDragOver(e, index)}
                  onDrop={(e) => handleFileDrop(e, index)}
                  onDragEnd={handleFileDragEnd}
                >
                  <div className="file-info">
                    <div className="file-title">
                      <span className="index">{index + 1}.</span>
                      <Tooltip content={file.name} side="top" align="start">
                        <span className="name">{file.name}</span>
                      </Tooltip>
                    </div>
                    <Tooltip content={file.path} side="bottom" align="start">
                      <span className="path">{file.path}</span>
                    </Tooltip>
                  </div>

                  <div
                    className="file-actions"
                    onClick={stopPropagation}
                    onDoubleClick={stopPropagation}
                  >
                    {canRename && (
                      <div className={styles.dropdownWrapper}>
                        <Menu.Root
                          open={isMenuOpen}
                          disabled={disabled}
                          onOpenChange={(open) =>
                            handleMenuOpenChange(file.path, open)
                          }
                        >
                          <Tooltip
                            content="発注エラーリスト名にリネーム"
                            disabled={disabled}
                          >
                            <Menu.Trigger
                              type="button"
                              className={styles.dropdownTrigger}
                              disabled={disabled}
                            >
                              <span>ファイル名リネーム</span>
                              <span className="arrow">▼</span>
                            </Menu.Trigger>
                          </Tooltip>

                          <Menu.Portal>
                            <Menu.Positioner
                              className={styles.dropdownPositioner}
                              side="bottom"
                              align="start"
                              sideOffset={4}
                            >
                              <Menu.Popup className={styles.dropdownMenu}>
                                {ORDER_TIME_OPTIONS.map((option) => (
                                  <Menu.Item
                                    key={option.value}
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      handleRowSelectRename(
                                        file.path,
                                        option.value,
                                      );
                                    }}
                                  >
                                    {option.value} ({option.timeLabel}発注)
                                  </Menu.Item>
                                ))}
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.Root>
                      </div>
                    )}

                    {!disabled && canRemove && (
                      <Tooltip content="削除">
                        <button
                          type="button"
                          className={styles.removeFileButton}
                          onClick={() => {
                            handleRemoveFileItem(index);
                          }}
                        >
                          ×
                        </button>
                      </Tooltip>
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

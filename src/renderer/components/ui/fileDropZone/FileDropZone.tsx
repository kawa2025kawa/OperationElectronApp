// src/renderer/components/ui/fileDropZone/FileDropZone.tsx

import { memo, type SyntheticEvent } from "react";
import { Menu } from "@base-ui/react/menu";

import * as styles from "./fileDropZone.css";

import {
  ORDER_TIME_OPTIONS,
  type FileDropZoneProps,
} from "./fileDropZoneTypes";

import { useFileDropZone } from "./useFileDropZone";

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
            className={`${styles.unifiedEmptyDropArea}${
              isDragOverMain ? " is-active" : ""
            }`}
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
            className={`${styles.unifiedFilesList}${
              isDragOverMain ? " is-active" : ""
            }`}
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

              const rowClassName = [
                styles.selectedFileRow,
                isMenuOpen && "is-open",
                isDragging && "is-dragging",
                isDropTarget && "is-drop-target",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={file.path}
                  className={rowClassName}
                  draggable={!disabled && canReorder && !isMenuOpen}
                  onDragStart={(e) => handleFileDragStart(e, index)}
                  onDragOver={(e) => handleFileDragOver(e, index)}
                  onDrop={(e) => handleFileDrop(e, index)}
                  onDragEnd={handleFileDragEnd}
                >
                  <div className="file-info">
                    <div className="file-title">
                      <span className="index">{index + 1}.</span>
                      <span className="name" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <span className="path" title={file.path}>
                      {file.path}
                    </span>
                  </div>

                  <div
                    className="file-actions"
                    onClick={stopPropagation}
                    onDoubleClick={stopPropagation}
                    onMouseDown={stopPropagation}
                    onPointerDown={stopPropagation}
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
                          <Menu.Trigger
                            type="button"
                            className={styles.dropdownTrigger}
                            disabled={disabled}
                            title="発注エラーリスト名にリネーム"
                          >
                            <span>ファイル名リネーム</span>
                            <span className="arrow">▼</span>
                          </Menu.Trigger>

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
                      <button
                        type="button"
                        className={styles.removeFileButton}
                        onClick={() => {
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

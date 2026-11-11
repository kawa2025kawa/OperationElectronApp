// src/renderer/components/ui/fileDropZone/useFileDropZone.ts

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { ORDER_TIME_OPTIONS, type FileDropZoneItem } from "./fileDropZoneTypes";

interface UseFileDropZoneProps {
  files?: readonly FileDropZoneItem[];
  disabled?: boolean;
  onFileSelect: (files: File[]) => void;
  onReorderFile?: (fromIndex: number, toIndex: number) => void;
  onRemoveFile?: (index: number) => void;
  onRenameFile?: (filePath: string, newName: string) => void | Promise<void>;
}

function getTodayString(): string {
  const now = new Date();

  return `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
}

function generateOrderErrorFileName(timeLabel: string): string {
  return `${getTodayString()}_${timeLabel}発注_発注エラーリスト.pdf`;
}

export function useFileDropZone({
  files = [],
  disabled = false,
  onFileSelect,
  onReorderFile,
  onRemoveFile,
  onRenameFile,
}: UseFileDropZoneProps) {
  const [isDragOverMain, setIsDragOverMain] = useState(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(
    null,
  );

  const [rawOpenMenuPath, setRawOpenMenuPath] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  // disabled のときはメニューが開かないよう派生値として制御（useEffect での setState を排除）
  const openMenuPath = disabled ? null : rawOpenMenuPath;

  const resetFileDrag = useCallback(() => {
    setDraggedFileIndex(null);
    setDragOverFileIndex(null);
  }, []);

  useEffect(() => resetFileDrag, [resetFileDrag]);

  // メニュー外部クリック時の検知（外部システム/DOMイベントの購読）
  useEffect(() => {
    if (openMenuPath === null) return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (!menuContainerRef.current?.contains(event.target as Node)) {
        setRawOpenMenuPath(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuPath]);

  const handleToggleMenu = useCallback(
    (path: string) => {
      if (disabled) return;
      setRawOpenMenuPath((prev) => (prev === path ? null : path));
    },
    [disabled],
  );

  const handleMainDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled) {
        setIsDragOverMain(true);
      }
    },
    [disabled],
  );

  const handleMainDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragOverMain(false);
    },
    [],
  );

  const handleMainDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragOverMain(false);

      if (disabled) return;

      const droppedFiles = Array.from(event.dataTransfer.files);

      if (droppedFiles.length > 0) {
        onFileSelect(droppedFiles);
      }
    },
    [disabled, onFileSelect],
  );

  const handleMainInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);

      if (!disabled && selectedFiles.length > 0) {
        onFileSelect(selectedFiles);
      }

      event.target.value = "";
    },
    [disabled, onFileSelect],
  );

  const handleFileDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      if (disabled || !onReorderFile) return;

      event.dataTransfer.effectAllowed = "move";
      setDraggedFileIndex(index);
    },
    [disabled, onReorderFile],
  );

  const handleFileDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      if (disabled || !onReorderFile || draggedFileIndex === null) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      setDragOverFileIndex(index);
    },
    [disabled, draggedFileIndex, onReorderFile],
  );

  const handleFileDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
      if (disabled || !onReorderFile || draggedFileIndex === null) return;

      event.preventDefault();
      event.stopPropagation();

      if (
        draggedFileIndex !== targetIndex &&
        draggedFileIndex >= 0 &&
        draggedFileIndex < files.length &&
        targetIndex >= 0 &&
        targetIndex < files.length
      ) {
        onReorderFile(draggedFileIndex, targetIndex);
      }

      resetFileDrag();
    },
    [disabled, draggedFileIndex, files.length, onReorderFile, resetFileDrag],
  );

  const handleFileDragEnd = resetFileDrag;

  const handleRemoveFileItem = useCallback(
    (index: number) => {
      if (!disabled) {
        onRemoveFile?.(index);
      }
    },
    [disabled, onRemoveFile],
  );

  const handleRowSelectRename = useCallback(
    (filePath: string, orderValue: string) => {
      if (disabled || !onRenameFile || !filePath || !orderValue) return;

      const option = ORDER_TIME_OPTIONS.find(
        ({ value }) => value === orderValue,
      );

      if (!option) return;

      setRawOpenMenuPath(null);
      void onRenameFile(filePath, generateOrderErrorFileName(option.timeLabel));
    },
    [disabled, onRenameFile],
  );

  return {
    isDragOverMain,
    draggedFileIndex,
    dragOverFileIndex,
    openMenuPath,
    menuContainerRef,
    mainInputRef,
    handleToggleMenu,
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
  };
}

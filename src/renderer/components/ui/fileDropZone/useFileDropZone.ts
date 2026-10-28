// src/renderer/components/ui/fileDropZone/useFileDropZone.ts

import { useRef, useState, useCallback } from "react";
import type { DragEvent, KeyboardEvent, ChangeEvent } from "react";

interface FileDropZoneItem {
  name: string;
  path: string;
}

export interface FileDropZoneProps {
  files?: FileDropZoneItem[];
  onFileSelect: (files: File[]) => void;
  onReorderFile?: (fromIndex: number, toIndex: number) => void;
  onRemoveFile?: (index: number) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export const useFileDropZone = ({
  files = [],
  onFileSelect,
  onReorderFile,
  onRemoveFile,
  disabled = false,
}: Pick<
  FileDropZoneProps,
  "files" | "onFileSelect" | "onReorderFile" | "onRemoveFile" | "disabled"
>) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(
    null,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const draggedFileIndexRef = useRef<number | null>(null);

  // 外部ファイルのドロップエリア

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (disabled) return;

      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = event.dataTransfer.files;

      if (!droppedFiles || droppedFiles.length === 0) return;

      onFileSelect(Array.from(droppedFiles));
    },
    [disabled, onFileSelect],
  );

  // ファイル選択

  const handleClick = useCallback(() => {
    if (disabled) return;

    inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = event.target.files;

      if (!selectedFiles || selectedFiles.length === 0) return;

      onFileSelect(Array.from(selectedFiles));
      event.target.value = "";
    },
    [disabled, onFileSelect],
  );

  // 選択済みファイルのドラッグ並び替え

  const resetFileDragState = useCallback(() => {
    draggedFileIndexRef.current = null;
    setDraggedFileIndex(null);
    setDragOverFileIndex(null);
  }, []);

  const handleFileDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      if (disabled || !onReorderFile) {
        event.preventDefault();
        return;
      }

      draggedFileIndexRef.current = index;
      setDraggedFileIndex(index);
      setDragOverFileIndex(null);

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },
    [disabled, onReorderFile],
  );

  const handleFileDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, index: number) => {
      if (disabled || !onReorderFile) return;

      const fromIndex = draggedFileIndexRef.current;

      if (fromIndex === null || fromIndex === index) {
        setDragOverFileIndex(null);
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      setDragOverFileIndex(index);
    },
    [disabled, onReorderFile],
  );

  const handleFileDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, toIndex: number) => {
      if (disabled || !onReorderFile) return;

      event.preventDefault();
      event.stopPropagation();

      const fromIndex = draggedFileIndexRef.current;

      if (
        fromIndex !== null &&
        fromIndex !== toIndex &&
        fromIndex >= 0 &&
        fromIndex < files.length &&
        toIndex >= 0 &&
        toIndex < files.length
      ) {
        onReorderFile(fromIndex, toIndex);
      }

      resetFileDragState();
    },
    [disabled, files.length, onReorderFile, resetFileDragState],
  );

  const handleFileDragEnd = useCallback(() => {
    resetFileDragState();
  }, [resetFileDragState]);

  // ファイル削除

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (disabled || !onRemoveFile) return;

      onRemoveFile(index);
    },
    [disabled, onRemoveFile],
  );

  return {
    isDragOver,
    draggedFileIndex,
    dragOverFileIndex,
    inputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleKeyDown,
    handleInputChange,
    handleFileDragStart,
    handleFileDragOver,
    handleFileDrop,
    handleFileDragEnd,
    handleRemoveFile,
  };
};

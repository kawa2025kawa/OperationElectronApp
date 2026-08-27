// src/renderer/components/ui/fileDropZone/useFileDropZone.ts

import { useRef, useState } from "react";

export interface FileDropZoneItem {
  name: string;
  path: string;
}

// ★ export を追加
export interface FileDropZoneProps {
  files?: FileDropZoneItem[];
  onFileSelect: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export const useFileDropZone = ({
  onFileSelect,
  onRemoveFile,
  disabled = false,
}: Pick<FileDropZoneProps, "onFileSelect" | "onRemoveFile" | "disabled">) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = event.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    onFileSelect(Array.from(droppedFiles));
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    onFileSelect(Array.from(selectedFiles));
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    if (disabled || !onRemoveFile) return;
    onRemoveFile(index);
  };

  return {
    isDragOver,
    inputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleKeyDown,
    handleInputChange,
    handleRemoveFile,
  };
};

import { useRef, useState, useCallback } from "react";

export interface FileDropZoneItem {
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
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
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFiles = event.dataTransfer.files;
      if (!droppedFiles || droppedFiles.length === 0) return;

      onFileSelect(Array.from(droppedFiles));
    },
    [disabled, onFileSelect],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      onFileSelect(Array.from(selectedFiles));
      event.target.value = "";
    },
    [disabled, onFileSelect],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (disabled || !onReorderFile || index <= 0) return;
      onReorderFile(index, index - 1);
    },
    [disabled, onReorderFile],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (disabled || !onReorderFile || index >= files.length - 1) return;
      onReorderFile(index, index + 1);
    },
    [disabled, files.length, onReorderFile],
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (disabled || !onRemoveFile) return;
      onRemoveFile(index);
    },
    [disabled, onRemoveFile],
  );

  return {
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
  };
};

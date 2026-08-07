import React from "react";

interface DropAreaProps {
  files?: File[];
  onDrop: (files: File[]) => void;

  accept?: Record<string, string[]>;

  multiple?: boolean;

  placeholder?: string;

  isDragging?: boolean;
}

export const DropArea: React.FC<DropAreaProps> = ({
  onDrop,
  placeholder = "ファイルをドロップしてください",
  multiple = true,
}) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const droppedFiles = Array.from(e.dataTransfer.files);

    if (droppedFiles.length === 0) {
      return;
    }

    onDrop(multiple ? droppedFiles : [droppedFiles[0]]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: "2px dashed #ccc",
        padding: "20px",
      }}
    >
      <p>{placeholder}</p>
    </div>
  );
};

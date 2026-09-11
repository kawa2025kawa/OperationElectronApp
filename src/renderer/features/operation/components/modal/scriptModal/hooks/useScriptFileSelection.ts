import { useCallback, useState } from "react";
import { commands } from "@renderer/services/commands";

export interface ScriptFileItem {
  name: string;
  path: string;
}

function extractFilePath(file: File): string {
  return (
    commands.getFilePath(file) ||
    ("path" in file && typeof file.path === "string" ? file.path : "") ||
    file.name
  );
}

export function useScriptFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);

  const handleFileSelect = useCallback((files: File[]) => {
    const items = files
      .map(
        (file): ScriptFileItem => ({
          name: file.name,
          path: extractFilePath(file),
        }),
      )
      .filter(({ path }) => Boolean(path));

    if (items.length === 0) return;
    setSelectedFiles((currentFiles) => [...currentFiles, ...items]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    selectedFiles,
    handleFileSelect,
    handleRemoveFile,
    clearFiles,
  };
}

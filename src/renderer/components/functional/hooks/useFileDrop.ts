// src/renderer/components/functional/hooks/useFileDrop.ts

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFileDropOptions {
  disabled?: boolean;
  multiple?: boolean;
  acceptExtensions?: string[];
  onFilesSelected?: (paths: string[]) => void;
}

export function useFileDrop(options: UseFileDropOptions = {}) {
  const {
    disabled = false,
    multiple = true,
    acceptExtensions = ["pdf"],
    onFilesSelected,
  } = options;

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  // Electron IPC: Main プロセスからの Drag & Drop やファイルドロップイベントを登録
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    try {
      cleanup = window.electronAPI.on?.("file-drop", (...args: unknown[]) => {
        if (disabledRef.current) return;
        const paths = args[0] as string[];
        if (paths && paths.length > 0) {
          onFilesSelected?.(paths);
        }
      });
    } catch (err) {
      console.error("[useFileDrop] Electron File Drop Listener Error:", err);
    }

    return () => {
      cleanup?.();
    };
  }, [onFilesSelected]);

  // Native File Dialog 呼び出し (Electron showOpenDialog 経由)
  const openFileDialog = useCallback(async () => {
    if (disabled) return;

    try {
      let selected: string[] | null = null;

      if (window.electronAPI.showOpenDialog) {
        selected = await window.electronAPI.showOpenDialog({
          properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
          filters: [{ name: "Files", extensions: acceptExtensions }],
        });
      } else {
        selected = await window.electronAPI.invoke<string[] | null>(
          "show-open-dialog",
          {
            multiple,
            acceptExtensions,
          },
        );
      }

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      if (paths.length > 0) {
        onFilesSelected?.(paths);
      }
    } catch (err) {
      console.error("[useFileDrop] Open File Dialog Error:", err);
    }
  }, [acceptExtensions, disabled, multiple, onFilesSelected]);

  return {
    isDragging,
    setIsDragging,
    openFileDialog,
  };
}

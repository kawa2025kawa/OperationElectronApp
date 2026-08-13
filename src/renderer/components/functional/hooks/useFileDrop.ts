// src/renderer/components/functional/hooks/useFileDrop.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { fileDialogService } from "@shared/store/slices/services/fileDialogService";

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
    } catch (error) {
      console.error("[useFileDrop] Electron File Drop Listener Error:", error);
    }

    return () => {
      cleanup?.();
    };
  }, [onFilesSelected]);

  const openFileDialog = useCallback(async () => {
    if (disabled) return;

    try {
      const paths = await fileDialogService.openFileDialog({
        multiple,
        acceptExtensions,
      });

      if (paths.length > 0) {
        onFilesSelected?.(paths);
      }
    } catch (error) {
      console.error("[useFileDrop] Open File Dialog Error:", error);
    }
  }, [acceptExtensions, disabled, multiple, onFilesSelected]);

  return {
    isDragging,
    setIsDragging,
    openFileDialog,
  };
}

// src/renderer/features/operation/components/table/useOperationTableHotkeys.ts

import { useEffect } from "react";
import { useAppStore } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { suppressNextSuccessToast } from "@shared/utils/statusToastSuppression";

export const useTableHotkeys = (
  targetMode: ViewMode,
  rowIds: string[],
  selectedId: string,
  setSelectedId: (id: string) => void,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mode = useAppStore.getState().currentMode;
      if (mode !== targetMode) return;

      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName))
        return;
      if (rowIds.length === 0) return;

      const currentIndex = selectedId ? rowIds.indexOf(selectedId) : -1;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);
        if (nextIndex >= 0 && rowIds[nextIndex]) {
          setSelectedId(rowIds[nextIndex]);
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex >= 0 && rowIds[prevIndex]) {
          setSelectedId(rowIds[prevIndex]);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();

        // 🎯 画面上でアクティブになっているフォーカス（ボタン等）を強制的に解除
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        if (!selectedId) return;

        suppressNextSuccessToast(selectedId);
        void useAppStore.getState().completeSelectedOperation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetMode, rowIds, selectedId, setSelectedId]);
};

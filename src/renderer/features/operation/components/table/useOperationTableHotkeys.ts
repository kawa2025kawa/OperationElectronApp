// src/renderer/features/operation/components/table/useOperationTableHotkeys.ts
import { useEffect } from "react";
import { useAppStore } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";
import { completeSelectedOperation } from "@renderer/features/operation/actions/operationActions";

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
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      )
        return;
      if (rowIds.length === 0) return;
      const currentIndex = selectedId ? rowIds.indexOf(selectedId) : -1;

      // ↓ / j : 下移動
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);
        if (nextIndex >= 0 && rowIds[nextIndex])
          setSelectedId(rowIds[nextIndex]);
      }
      // ↑ / k : 上移動
      else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex >= 0 && rowIds[prevIndex])
          setSelectedId(rowIds[prevIndex]);
      }
      // Enter : 完了処理実行
      else if (e.key === "Enter") {
        e.preventDefault();
        if (!selectedId) return;
        void completeSelectedOperation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetMode, rowIds, selectedId, setSelectedId]);
};

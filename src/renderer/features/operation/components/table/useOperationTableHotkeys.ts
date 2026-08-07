// src/renderer/features/operation/components/table/useOperationTableHotkeys.ts

import { useEffect } from "react";
import { useAppStore } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";

export const useTableHotkeys = (
  targetMode: ViewMode,
  rowIds: string[],
  selectedId: string,
  setSelectedId: (id: string) => void,
) => {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
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

      // 下キー / j : 次の行へ移動
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);
        if (nextIndex >= 0 && rowIds[nextIndex])
          setSelectedId(rowIds[nextIndex]);
      }
      // 上キー / k : 前の行へ移動
      else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex >= 0 && rowIds[prevIndex])
          setSelectedId(rowIds[prevIndex]);
      }
      // Enterキー : 選択中行のStatusを「完了(success)」に更新
      else if (e.key === "Enter") {
        e.preventDefault();
        if (!selectedId) return;

        try {
          await window.electronAPI.invoke("updateJobStatus", {
            kanriNo: selectedId,
            status: "success",
          });
        } catch (error) {
          console.error("[TableHotkeys] ステータス更新エラー:", error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetMode, rowIds, selectedId, setSelectedId]);
};

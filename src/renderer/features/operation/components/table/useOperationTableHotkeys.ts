import { useEffect } from "react";
import { useAppStore } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";
import { completeSelectedOperation } from "@renderer/features/operation/actions/operationActions";
// 🎯 修正: 候補に出ていた正しい関数名 suppressNextSuccessToast をインポート
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
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)) return;
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
        if (!selectedId) return;

        // 🎯 修正: 正しい関数名で呼び出し
        suppressNextSuccessToast(selectedId);
        void completeSelectedOperation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetMode, rowIds, selectedId, setSelectedId]);
};

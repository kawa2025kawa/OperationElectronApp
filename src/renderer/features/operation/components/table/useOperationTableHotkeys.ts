// src/renderer/features/operation/components/table/useOperationTableHotkeys.ts

import { useEffect } from "react";
import { useAppStore } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

// テーブルの上下移動（↑/↓, j/k）および Enter によるステータス完了操作を制御する。
export const useTableHotkeys = (
  currentMode: ViewMode,
  rowIds: string[],
  selectedId: string,
  setSelectedId: (id: string) => void,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      // 入力フォーム操作中はショートカットを無効化
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      ) {
        return;
      }

      if (rowIds.length === 0) return;

      const currentIndex = selectedId ? rowIds.indexOf(selectedId) : -1;

      // 下移動 (ArrowDown / j)
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);
        const nextId = rowIds[nextIndex];
        if (nextId) setSelectedId(nextId);
        return;
      }

      // 上移動 (ArrowUp / k)
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const previousIndex = Math.max(currentIndex - 1, 0);
        const previousId = rowIds[previousIndex];
        if (previousId) setSelectedId(previousId);
        return;
      }

      // 完了ステータス更新 (Enter) - irregular モード以外で適用
      if (e.key === "Enter") {
        e.preventDefault();

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        if (!selectedId || currentMode === "irregular") return;

        useAppStore.getState().updateOperationStatus({
          kanriNo: selectedId,
          status: JOB_STATUS.SUCCESS,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentMode, rowIds, selectedId, setSelectedId]);
};

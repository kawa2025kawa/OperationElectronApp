//src\renderer\features\operation\components\table\useOperationTableHotkeys.ts

import { useEffect } from "react";

import { useAppStore } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

export const useTableHotkeys = (
  targetMode: ViewMode,
  rowIds: string[],
  selectedId: string,
  setSelectedId: (id: string) => void,
) => {
  const currentMode = useAppStore((state) => state.currentMode);

  useEffect(() => {
    if (currentMode !== targetMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      ) {
        return;
      }

      if (rowIds.length === 0) return;

      const currentIndex = selectedId ? rowIds.indexOf(selectedId) : -1;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();

        const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);

        const nextId = rowIds[nextIndex];

        if (nextId) {
          setSelectedId(nextId);
        }

        return;
      }

      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();

        const previousIndex = Math.max(currentIndex - 1, 0);
        const previousId = rowIds[previousIndex];

        if (previousId) {
          setSelectedId(previousId);
        }

        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        if (!selectedId) return;

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
  }, [currentMode, targetMode, rowIds, selectedId, setSelectedId]);
};

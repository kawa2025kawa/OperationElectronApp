//src/renderer/features/operation/components/table/useOperationTable.ts

import { useCallback } from "react";

import { useAppStore } from "@renderer/store";

import {
  selectCurrentMode,
  selectFilteredIrregularIds,
  selectFilteredOperationIds,
  selectFilteredTodayIds,
  selectOperationTableData,
  selectIrregularTableData,
  selectTodayTableData,
} from "@renderer/features/operation/store/operationSelectors";

import { useTableHotkeys } from "./useOperationTableHotkeys";

export const useOperationTable = () => {
  const currentMode = useAppStore(selectCurrentMode);
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  const selectedId = useAppStore(
    (state) => state.selectedIds[currentMode] ?? "",
  );

  const operationIds = useAppStore(selectFilteredOperationIds);
  const irregularIds = useAppStore(selectFilteredIrregularIds);
  const todayIds = useAppStore(selectFilteredTodayIds);

  const operationRows = useAppStore(selectOperationTableData);
  const irregularRows = useAppStore(selectIrregularTableData);
  const todayRows = useAppStore(selectTodayTableData);

  const rowIds =
    currentMode === "irregular"
      ? irregularIds
      : currentMode === "today"
        ? todayIds
        : operationIds;

  const rows =
    currentMode === "irregular"
      ? irregularRows
      : currentMode === "today"
        ? todayRows
        : operationRows;

  const handleRowClick = useCallback(
    (id: string) => {
      setSelectedId(currentMode, id);
    },
    [currentMode, setSelectedId],
  );

  useTableHotkeys(currentMode, rowIds, selectedId, handleRowClick);

  return {
    currentMode,
    rows,
    selectedId,
    handleRowClick,
  };
};

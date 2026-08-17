import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import type { Column } from "@shared/types/tableType";
import type { ViewMode } from "@shared/types/uiType";
import {
  selectCurrentMode,
  selectFilteredIrregularIds,
  selectFilteredOperationIds,
  selectFilteredTodayIds,
  selectSelectedIrregularId,
  selectSelectedOperationId,
  selectSelectedTodayId,
} from "@renderer/features/operation/store/operationSelectors";
import type { OperationItem } from "@shared/types/operationType";
import { useTableHotkeys } from "./useOperationTableHotkeys";

const OPERATION_COLUMNS: Column<OperationItem>[] = [
  { key: "scheduledTime", label: "時刻", width: "10%", align: "left" },
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "workName", label: "作業名", width: "44%", align: "left" },
  { key: "jobId", label: "Job ID", width: "24%", align: "left" },
  { key: "status", label: "状態", width: "16%", align: "left" },
];

const IRREGULAR_COLUMNS: Column<OperationItem>[] = [
  { key: "scheduledTime", label: "時刻", width: "15%", align: "left" },
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "cycle1", label: "C1", width: "10%", align: "left" },
  { key: "cycle2", label: "C2", width: "10%", align: "left" },
  { key: "workName", label: "作業名", width: "55%", align: "left" },
];

const TODAY_COLUMNS: Column<OperationItem>[] = [
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "scheduledTime", label: "時刻", width: "15%", align: "left" },
  { key: "workName", label: "作業名", width: "40%", align: "left" },
  { key: "status", label: "状態", width: "20%", align: "left" },
];

const getColumns = (mode: ViewMode): Column<OperationItem>[] => {
  switch (mode) {
    case "irregular":
      return IRREGULAR_COLUMNS;
    case "today":
      return TODAY_COLUMNS;
    case "operation":
    default:
      return OPERATION_COLUMNS;
  }
};

export const useOperationTable = () => {
  const currentMode = useAppStore(selectCurrentMode);

  const selectedOperationId = useAppStore(selectSelectedOperationId) ?? "";
  const selectedIrregularId = useAppStore(selectSelectedIrregularId) ?? "";
  const selectedTodayId = useAppStore(selectSelectedTodayId) ?? "";
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  const operationRowIds = useAppStore(useShallow(selectFilteredOperationIds));
  const irregularRowIds = useAppStore(useShallow(selectFilteredIrregularIds));
  const todayRowIds = useAppStore(useShallow(selectFilteredTodayIds));

  const rowIds = useMemo(() => {
    switch (currentMode) {
      case "irregular":
        return irregularRowIds;
      case "today":
        return todayRowIds;
      case "operation":
      default:
        return operationRowIds;
    }
  }, [currentMode, operationRowIds, irregularRowIds, todayRowIds]);

  const selectedId = useMemo(() => {
    switch (currentMode) {
      case "irregular":
        return selectedIrregularId;
      case "today":
        return selectedTodayId;
      case "operation":
      default:
        return selectedOperationId;
    }
  }, [currentMode, selectedOperationId, selectedIrregularId, selectedTodayId]);

  const handleRowClick = useCallback(
    (id: string) => {
      setSelectedId(currentMode, id);
    },
    [currentMode, setSelectedId],
  );

  const columns = useMemo(() => getColumns(currentMode), [currentMode]);

  useTableHotkeys(currentMode, rowIds, selectedId, handleRowClick);

  return {
    currentMode,
    rowIds,
    columns,
    selectedId,
    handleRowClick,
  };
};

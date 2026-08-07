// src/renderer/features/operation/components/table/useOperationTable.ts
import { useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import {
  selectFilteredOperationIds,
  selectFilteredIrregularIds,
  selectFilteredTodayIds,
  selectCurrentMode,
  selectSelectedOperationId,
  selectSelectedIrregularId,
} from "@shared/store/selectors/operationSelectors";
import { useTableHotkeys } from "./useOperationTableHotkeys";
import type { ViewMode } from "@shared/types/uiType";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";

const OPERATION_COLUMNS: Column<OperationItem>[] = [
  { key: "scheduledTime", label: "予定", width: "10%", align: "left" },
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "workName", label: "作業名", width: "44%", align: "left" },
  { key: "jobId", label: "Job ID", width: "24%", align: "left" },
  { key: "status", label: "ステータス", width: "16%", align: "left" },
];

const IRREGULAR_COLUMNS: Column<OperationItem>[] = [
  { key: "scheduledTime", label: "予定", width: "15%", align: "left" },
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "cycle1", label: "C1", width: "10%", align: "left" },
  { key: "cycle2", label: "C2", width: "10%", align: "left" },
  { key: "workName", label: "作業名", width: "55%", align: "left" },
];

const TODAY_COLUMNS: Column<OperationItem>[] = [
  { key: "kanriNo", label: "No", width: "10%", align: "left" },
  { key: "workName", label: "作業名", width: "40%", align: "left" },
  { key: "cycle1", label: "サイクル1", width: "25%", align: "left" },
  { key: "cycle2", label: "サイクル2", width: "25%", align: "left" },
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
  // モードと選択IDを安全に取得
  const currentMode = useAppStore(selectCurrentMode);
  const selectedOperationId = useAppStore(selectSelectedOperationId) ?? "";
  const selectedIrregularId = useAppStore(selectSelectedIrregularId) ?? "";
  const setSelectedOperationId = useAppStore((s) => s.setSelectedOperationId);
  const setSelectedIrregularId = useAppStore((s) => s.setSelectedIrregularId);

  // 配列を返すセレクターは useShallow で個別に取得（参照比較の無限ループ防止）
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
  }, [currentMode, irregularRowIds, todayRowIds, operationRowIds]);

  const selectedId = useMemo(() => {
    return currentMode === "operation"
      ? selectedOperationId
      : selectedIrregularId;
  }, [currentMode, selectedOperationId, selectedIrregularId]);

  const setSelectedId = useCallback(
    (id: string) => {
      if (currentMode === "operation") {
        setSelectedOperationId(id);
      } else {
        setSelectedIrregularId(id);
      }
    },
    [currentMode, setSelectedOperationId, setSelectedIrregularId],
  );

  const columns = useMemo(() => getColumns(currentMode), [currentMode]);

  // ホットキー制御
  useTableHotkeys(currentMode, rowIds, selectedId, setSelectedId);

  return {
    currentMode,
    rowIds,
    columns,
    selectedId,
    handleRowClick: setSelectedId,
  };
};

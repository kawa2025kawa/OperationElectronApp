// src/renderer/features/operation/components/table/useOperationTable.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

import { trpc } from "@renderer/lib/trpc";
import { useAppStore } from "@renderer/store";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import { selectFilteredTableRows } from "@renderer/features/operation/store/operationSelectors";
import { useTableHotkeys } from "./useOperationTableHotkeys";

export const useOperationTable = () => {
  const [rawRows, setRawRows] = useState<OperationViewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { currentMode, selectedId, searchTerm, setSelectedId } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      selectedId: state.selectedIds[state.currentMode] ?? "",
      searchTerm: state.searchTerm,
      setSelectedId: state.setSelectedId,
    })),
  );

  // tRPC経由でMainプロセスから結合済みのテーブルデータを取得[cite: 1]
  const fetchTableData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.operation.getTableData.query({
        mode: currentMode,
      });
      setRawRows(data);
    } catch (error) {
      console.error("[useOperationTable] Failed to fetch table data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMode]);

  // モード切り替え時および初期表示時のデータ取得
  useEffect(() => {
    void fetchTableData();
  }, [fetchTableData]);

  // Mainプロセスからのステータス更新通知 (IPC) を受領した際にリアルタイム自動再取得[cite: 1]
  useEffect(() => {
    const unsubscribe = window.electronAPI.on(
      IPC_CHANNELS.OPERATION.STATUS_UPDATED,
      () => {
        void fetchTableData();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [fetchTableData]);

  // 検索キーワードに応じたフィルタリング結果の計算[cite: 1]
  const rows = useMemo(
    () => selectFilteredTableRows(rawRows, searchTerm),
    [rawRows, searchTerm],
  );

  // ホットキー制御用の管理Noリストを生成
  const rowIds = useMemo(() => rows.map((row) => row.kanriNo), [rows]);

  const handleRowClick = useCallback(
    (id: string) => {
      setSelectedId(currentMode, id);
    },
    [currentMode, setSelectedId],
  );

  // テーブルキーボードショートカット（上下移動・選択等）のバインド
  useTableHotkeys(currentMode, rowIds, selectedId, handleRowClick);

  return {
    currentMode,
    rows,
    selectedId,
    isLoading,
    handleRowClick,
    refetch: fetchTableData,
  };
};

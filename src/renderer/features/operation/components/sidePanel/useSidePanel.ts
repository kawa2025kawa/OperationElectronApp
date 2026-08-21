// src/renderer/features/operation/components/sidePanel/useSidePanel.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

export interface InfoRowData {
  label: string;
  value: string | number | null | undefined;
}

// 静的な定数はフック外に配置してメモリ生成コストを抑える
const CONFIG_ACTIONS = operationViewConfig.actions ?? [];
const EMPTY_ACTIONS: typeof CONFIG_ACTIONS = [];

export const useSidePanel = () => {
  const {
    selectedItem,
    status,
    currentMode,
    setMode,
    openGlobalModal,
    closeGlobalModal,
  } = useAppStore(
    useShallow((s) => {
      const flags = selectActiveItemStatusFlags(s);
      return {
        selectedItem: flags.item,
        status: flags.status,
        currentMode: s.currentMode,
        setMode: s.setMode,
        openGlobalModal: s.openGlobalModal,
        closeGlobalModal: s.closeGlobalModal,
      };
    }),
  );

  // アクティブなアクションのみ抽出
  const activeActions = useMemo(() => {
    if (!selectedItem) return EMPTY_ACTIONS;
    return CONFIG_ACTIONS.filter((action) => action.isActive(selectedItem));
  }, [selectedItem]);

  const executeAction = useCallback(
    (key: string) => {
      const action = CONFIG_ACTIONS.find((item) => item.key === key);
      if (!action || !selectedItem) return;

      action.execute(selectedItem, {
        openGlobalModal,
        closeGlobalModal,
      });
    },
    [selectedItem, openGlobalModal, closeGlobalModal],
  );

  const infoRows = useMemo<InfoRowData[]>(
    () => [
      { label: "管理 No", value: selectedItem?.kanriNo },
      { label: "作業名", value: selectedItem?.workName },
      { label: "ステータス", value: getStatusLabel(status) },
      {
        label: "開始時刻",
        value: formatToJapaneseDateTime(selectedItem?.startTime),
      },
      {
        label: "終了時刻",
        value: formatToJapaneseDateTime(selectedItem?.endTime),
      },
      {
        label: "サブステータス",
        value: selectedItem?.substatus?.length
          ? selectedItem.substatus.join(", ")
          : "-",
      },
      { label: "備考", value: selectedItem?.comment },
    ],
    [selectedItem, status],
  );

  return {
    selectedItem,
    currentMode,
    activeActions,
    infoRows,
    setMode,
    executeAction,
  };
};

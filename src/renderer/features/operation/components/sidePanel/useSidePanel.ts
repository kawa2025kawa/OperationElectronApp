import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

export interface InfoRowData {
  label: string;
  value: string | number | null | undefined;
}

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

  const configuredActions = useMemo(
    () => operationViewConfig.actions ?? [],
    [],
  );

  // 選択中アイテムに対して isActive が true のアクションのみ抽出
  const activeActions = useMemo(() => {
    if (!selectedItem) return [];
    return configuredActions.filter((action) => action.isActive(selectedItem));
  }, [configuredActions, selectedItem]);

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      setMode(mode);
    },
    [setMode],
  );

  const executeAction = useCallback(
    (key: string) => {
      const action = configuredActions.find((item) => item.key === key);
      if (!action || !selectedItem) return;

      action.execute(selectedItem, {
        openGlobalModal,
        closeGlobalModal,
      });
    },
    [configuredActions, selectedItem, openGlobalModal, closeGlobalModal],
  );

  const infoRows = useMemo<InfoRowData[]>(
    () => [
      { label: "管理 No", value: selectedItem?.kanriNo },
      { label: "作業名", value: selectedItem?.workName },
      { label: "状態", value: getStatusLabel(status) },
      {
        label: "開始時刻",
        value: formatToJapaneseDateTime(selectedItem?.startTime),
      },
      {
        label: "終了時刻",
        value: formatToJapaneseDateTime(selectedItem?.endTime),
      },
      {
        label: "予定開始",
        value: formatToJapaneseDateTime(selectedItem?.expectedStartTime),
      },
      {
        label: "予定終了",
        value: formatToJapaneseDateTime(selectedItem?.expectedEndTime),
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
    handleModeChange,
    executeAction,
  };
};

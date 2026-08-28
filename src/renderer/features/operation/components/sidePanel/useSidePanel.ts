// src/renderer/features/operation/components/sidePanel/useSidePanel.ts

import React, { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { commands } from "@shared/service/commands";
import { useAppStore } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { OperationModal } from "../modal/OperationModal";

export interface InfoRowData {
  label: string;
  value: React.ReactNode;
}

export interface SidePanelAction {
  key: string;
  label: string;
  isActive: (item: OperationItem) => boolean;
  execute: (item: OperationItem) => void | Promise<void>;
}

const MANUAL_ALIAS_MAP: Record<string, string> = {
  "37": "30",
  "45": "30",
  "48": "30",
  "54": "30",
  "36": "29",
  "44": "29",
  "47": "29",
  "43": "28",
  "68": "28",
};

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

export const useSidePanel = () => {
  const {
    selectedItem,
    status,
    currentMode,
    setMode,
    runJcJob,
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
        runJcJob: s.runJcJob,
        openGlobalModal: s.openGlobalModal,
        closeGlobalModal: s.closeGlobalModal,
      };
    }),
  );

  const isLinkActive = useCallback((item: OperationItem): boolean => {
    return Boolean(item.link && Object.keys(item.link).length > 0);
  }, []);

  const openLinkModal = useCallback(() => {
    openGlobalModal(
      React.createElement(OperationModal, {
        type: "link",
        onClose: closeGlobalModal,
      }),
      {
        title: "Link",
        ...DEFAULT_MODAL_SIZE,
      },
    );
  }, [openGlobalModal, closeGlobalModal]);

  // アクション一覧のインスタンスを生成・保持
  const actions = useMemo<SidePanelAction[]>(
    () => [
      {
        key: "jc",
        label: "JC",
        isActive: (item) =>
          Boolean("jobId" in item && item.jobId && item.jobId !== "-"),
        execute: async (item) => {
          if (item.kanriNo) {
            await runJcJob(String(item.kanriNo));
          }
        },
      },
      {
        key: "script",
        label: "Script",
        isActive: (item) => Boolean(item.script),
        execute: (item) => {
          if (!item.kanriNo) return;
          openGlobalModal(
            React.createElement(OperationModal, {
              type: "script",
              onClose: closeGlobalModal,
            }),
            {
              title: "",
              ...DEFAULT_MODAL_SIZE,
            },
          );
        },
      },
      {
        key: "link",
        label: "Link",
        isActive: isLinkActive,
        execute: openLinkModal,
      },
      {
        key: "manual",
        label: "Manual",
        isActive: (item) => Boolean(item?.kanriNo),
        execute: async (item) => {
          const kanriNoStr = String(item.kanriNo).trim();
          const targetKanriNo = MANUAL_ALIAS_MAP[kanriNoStr] ?? kanriNoStr;
          const targetUrl = `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
          await commands.openExternal(targetUrl);
        },
      },
    ],
    [isLinkActive, openLinkModal, runJcJob, openGlobalModal, closeGlobalModal],
  );

  const activeActions = useMemo(() => {
    if (!selectedItem) return [];
    return actions.filter((action) => action.isActive(selectedItem));
  }, [actions, selectedItem]);

  const executeAction = useCallback(
    async (key: string) => {
      const action = actions.find((item) => item.key === key);
      if (!action || !selectedItem) return;
      await action.execute(selectedItem);
    },
    [actions, selectedItem],
  );

  // 表示用データのメモ化を最適化
  const infoRows = useMemo<InfoRowData[]>(
    () => [
      { label: "管理 No", value: selectedItem?.kanriNo },
      { label: "作業名", value: selectedItem?.workName },
      {
        label: "ステータス",
        value: React.createElement(StatusBadge, { status }),
      },
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
    hasSelection: Boolean(selectedItem),
    currentMode,
    activeActions,
    infoRows,
    setMode,
    executeAction,
  };
};

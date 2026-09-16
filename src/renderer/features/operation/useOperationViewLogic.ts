// src/renderer/features/operation/useOperationViewLogic.ts

import React, { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { getManualUrl } from "@renderer/features/operation/helpers/operationEntities";

import { LinkModalContent } from "./components/modal/linkModal/LinkModalContent";
import { ScriptModalContent } from "./components/modal/scriptModal/ScriptModalContent";

import type { OperationItem } from "@shared/types/operation";
import type { ViewMode } from "@shared/types/ui";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";

export interface InfoRowData {
  label: string;
  value: string | null | undefined;
}

export interface ViewAction {
  key: string;
  label: string;
  isActive: (item: OperationItem) => boolean;
  execute: (item: OperationItem) => void | Promise<void>;
}

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

export function useOperationViewLogic() {
  const {
    selectedItem,
    status,
    currentMode,
    setMode,
    runJcJob,
    openGlobalModal,
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
      };
    }),
  );

  const activeActions = useMemo<ViewAction[]>(() => {
    if (!selectedItem) return [];

    const actions: ViewAction[] = [];

    // 🎯 kind ではなく jobId の存在判定に修正
    if (
      "jobId" in selectedItem &&
      Boolean(selectedItem.jobId && selectedItem.jobId !== "-")
    ) {
      actions.push({
        key: "jc",
        label: "JC",
        isActive: () => true,
        execute: async (item) => {
          if (item.kanriNo) {
            await runJcJob(String(item.kanriNo));
          }
        },
      });
    }

    if (selectedItem.scripts && selectedItem.scripts.length > 0) {
      selectedItem.scripts.forEach((scriptConfig) => {
        actions.push({
          key: `script_${scriptConfig.key}`,
          label: scriptConfig.label,
          isActive: () => true,
          execute: (item) => {
            const targetKanriNo = scriptConfig.scriptKanriNo || item.kanriNo;
            const Content = () =>
              React.createElement(ScriptModalContent, {
                item,
                kanriNo: targetKanriNo,
              });
            Object.assign(Content, ScriptModalContent);
            openGlobalModal(Content, {
              title: `${item.workName || "Script実行"} (${scriptConfig.label})`,
            });
          },
        });
      });
    } else if (selectedItem.script) {
      actions.push({
        key: "script",
        label: "Script",
        isActive: () => true,
        execute: (item) => {
          const Content = () =>
            React.createElement(ScriptModalContent, { item });
          Object.assign(Content, ScriptModalContent);
          openGlobalModal(Content, {
            title: item.workName || "Script実行",
          });
        },
      });
    }

    if (selectedItem.link && Object.keys(selectedItem.link).length > 0) {
      actions.push({
        key: "link",
        label: "Link",
        isActive: () => true,
        execute: (item) => {
          if (item.link) {
            const Content = () =>
              React.createElement(LinkModalContent, { link: item.link });
            Object.assign(Content, LinkModalContent);
            openGlobalModal(Content, { title: "関連リンク" });
          }
        },
      });
    }

    if (selectedItem.manual) {
      actions.push({
        key: "manual",
        label: "Manual",
        isActive: () => true,
        execute: async (item) => {
          if (item.kanriNo) {
            await commands.openExternal(getManualUrl(item.kanriNo));
          }
        },
      });
    }

    return actions;
  }, [selectedItem, openGlobalModal, runJcJob]);

  const executeAction = useCallback(
    async (key: string) => {
      const action = activeActions.find((item) => item.key === key);
      if (!action || !selectedItem) return;
      await action.execute(selectedItem);
    },
    [activeActions, selectedItem],
  );

  const infoRows = useMemo<InfoRowData[]>(
    () => [
      { label: "管理No", value: selectedItem?.kanriNo },
      { label: "作業名", value: selectedItem?.workName },
      { label: "ステータス", value: status },
      {
        label: "開始時刻",
        value: formatToJapaneseDateTime(selectedItem?.startTime),
      },
      {
        label: "終了時刻",
        value: formatToJapaneseDateTime(selectedItem?.endTime),
      },
      {
        label: "詳細状況",
        value: selectedItem?.substatus?.length
          ? selectedItem.substatus.join(", ")
          : "-",
      },
      { label: "コメント", value: selectedItem?.comment },
    ],
    [selectedItem, status],
  );

  return {
    currentMode,
    activeActions,
    infoRows,
    status,
    isMenuVisible: Boolean(selectedItem) && activeActions.length > 0,
    setMode,
    executeAction,
  };
}

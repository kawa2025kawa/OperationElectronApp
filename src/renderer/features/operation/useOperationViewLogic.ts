// src/renderer/features/operation/useOperationViewLogic.ts

import React, { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

import { LinkModalContent } from "./components/modal/linkModal/LinkModalContent";
import { ScriptModalContent } from "./components/modal/scriptModal/ScriptModalContent";

import type { OperationItem } from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@renderer/registry/appRegistry";

/* ============================================================================
 * Types & Constants
 * ========================================================================== */

export interface InfoRowData {
  label: string;
  value: string;
}

export interface ViewAction {
  key: string;
  label: string;
  isActive: (item: OperationItem) => boolean;
  execute: (item: OperationItem) => void | Promise<void>;
}

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

const BASE_MANUAL_URL = "https://sites.google.com/belc.co.jp/operation-manual-";

/* ============================================================================
 * Helpers
 * ========================================================================== */

function toDisplayValue(value: unknown): string {
  if (value == null) return "-";

  if (value instanceof Date) {
    return value.toLocaleString("ja-JP");
  }

  const text = String(value).trim();

  return text || "-";
}

/**
 * UTC時刻をJSTへ変換して
 * yyyy/mm/dd hh:mm 形式で表示する。
 *
 * 内部データはUTCのまま保持し、
 * UI表示時だけ日本時間へ変換する。
 */
function formatDisplayDateTime(value: unknown): string {
  if (value == null) return "-";

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return toDisplayValue(value);
  }

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return (
    `${getPart("year")}/` +
    `${getPart("month")}/` +
    `${getPart("day")} ` +
    `${getPart("hour")}:` +
    `${getPart("minute")}`
  );
}

/* ============================================================================
 * Custom Hook
 * ========================================================================== */

export function useOperationViewLogic() {
  const {
    selectedItem,
    status,
    currentMode,
    setMode,
    runJcJob,
    openGlobalModal,
  } = useAppStore(
    useShallow((state) => {
      const flags = selectActiveItemStatusFlags(state);

      return {
        selectedItem: flags.item,
        status: flags.status,
        currentMode: state.currentMode,
        setMode: state.setMode,
        runJcJob: state.runJcJob,
        openGlobalModal: state.openGlobalModal,
      };
    }),
  );

  const activeActions = useMemo<ViewAction[]>(() => {
    if (!selectedItem) return [];

    const actions: ViewAction[] = [];

    /* JC */
    if (
      "jobId" in selectedItem &&
      Boolean(selectedItem.jobId && selectedItem.jobId !== "-")
    ) {
      actions.push({
        key: "jc",
        label: "JC",
        isActive: () => true,

        execute: async (item) => {
          if (!item.kanriNo) return;

          await runJcJob(String(item.kanriNo));
        },
      });
    }

    /* Script */
    if (selectedItem.scripts && selectedItem.scripts.length > 0) {
      selectedItem.scripts.forEach((scriptConfig) => {
        actions.push({
          key: `script_${scriptConfig.key}`,
          label: scriptConfig.label,
          isActive: () => true,

          execute: (item) => {
            const Content = () =>
              React.createElement(ScriptModalContent, {
                item,
                scriptKey: scriptConfig.key,
              });

            Object.assign(Content, ScriptModalContent);

            openGlobalModal(Content, {
              title: `${item.workName || "Script実行"} (${scriptConfig.label})`,
            });
          },
        });
      });
    }

    /* Link */
    if (selectedItem.link && selectedItem.link.length > 0) {
      actions.push({
        key: "link",
        label: "Link",
        isActive: () => true,

        execute: (item) => {
          if (!item.link) return;

          const Content = () =>
            React.createElement(LinkModalContent, {
              link: item.link,
            });

          Object.assign(Content, LinkModalContent);

          openGlobalModal(Content, {
            title: "リンク",
          });
        },
      });
    }

    /* Manual */
    if (
      selectedItem.manualUrl === true ||
      selectedItem.autoManualUrl === true
    ) {
      actions.push({
        key: "manual",
        label: "Manual",
        isActive: () => true,

        execute: async (item) => {
          const kanriNo = String(item.kanriNo ?? "").trim();

          if (!kanriNo) return;

          await commands.openExternal(`${BASE_MANUAL_URL}${kanriNo}`);
        },
      });
    }

    return actions;
  }, [selectedItem, openGlobalModal, runJcJob]);

  const executeAction = useCallback(
    async (key: string) => {
      if (!selectedItem) return;

      const action = activeActions.find((item) => item.key === key);

      if (!action) return;

      await action.execute(selectedItem);
    },
    [activeActions, selectedItem],
  );

  const infoRows = useMemo<InfoRowData[]>(() => {
    if (!selectedItem) {
      return [
        { label: "管理No", value: "-" },
        { label: "作業名", value: "-" },
        { label: "ステータス", value: "-" },
        { label: "開始時刻", value: "-" },
        { label: "終了時刻", value: "-" },
        { label: "コメント", value: "-" },
      ];
    }

    return [
      {
        label: "管理No",
        value: toDisplayValue(selectedItem.kanriNo),
      },
      {
        label: "作業名",
        value: toDisplayValue(selectedItem.workName),
      },
      {
        label: "ステータス",
        value: toDisplayValue(status ?? selectedItem.status),
      },
      {
        label: "開始時刻",
        value: formatDisplayDateTime(selectedItem.startTime),
      },
      {
        label: "終了時刻",
        value: formatDisplayDateTime(selectedItem.endTime),
      },
      {
        label: "コメント",
        value: toDisplayValue(selectedItem.comment),
      },
    ];
  }, [selectedItem, status]);

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

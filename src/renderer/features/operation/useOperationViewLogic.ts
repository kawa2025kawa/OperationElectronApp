// src/renderer/features/operation/useOperationViewLogic.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { operationService } from "@renderer/features/operation/operationService";
import {
  openLinkModal,
  openScriptModal,
} from "@renderer/features/operation/operationModal";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore, type AppState } from "@renderer/store";
import { selectActiveItemStatusFlags } from "@renderer/store/selectors/operationSelectors";

import type {
  OperationViewItem,
  LinkConfig,
} from "@shared/types/operation/operationTypes";

export interface ViewAction {
  readonly key: string;
  readonly label: string;
  readonly execute: (item: OperationViewItem) => void | Promise<void>;
}

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!Array.isArray(item.links)) {
    return [];
  }

  return item.links.flatMap((entry) => {
    const label = entry?.label?.trim();
    const path = entry?.path?.trim();

    return label && path ? [{ key: label, url: path }] : [];
  });
}

function createActiveActions(
  item: OperationViewItem,
  openGlobalModal: AppState["openGlobalModal"],
): ViewAction[] {
  const actions: ViewAction[] = [];

  if ("jobId" in item && Boolean(item.jobId)) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => operationService.executeJcJob(item.kanriNo),
    });
  }

  if (Array.isArray(item.ScriptKeys)) {
    item.ScriptKeys.forEach((script, index) => {
      const key = script?.key?.trim();

      if (!key || !script.executionTypes?.includes("manual")) {
        return;
      }

      actions.push({
        key: `script:${index}:${key}`,
        label: script.label?.trim() || key,
        execute: () => openScriptModal(openGlobalModal, item, key),
      });
    });
  }

  const links = getLinkConfigs(item);

  if (links.length > 0) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => openLinkModal(openGlobalModal, links),
    });
  }

  if (typeof item.manualUrl === "string" && item.manualUrl) {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: async () => {
        await systemIpcService.openManual(item.manualUrl as string);
      },
    });
  }

  if (typeof item.autoManualUrl === "string" && item.autoManualUrl) {
    actions.push({
      key: "autoManual",
      label: "AutoManual",
      execute: async () => {
        await systemIpcService.openManual(item.autoManualUrl as string);
      },
    });
  }

  return actions;
}

export function useOperationViewLogic(rowsInput?: OperationViewItem[]) {
  const { currentMode, setMode, openGlobalModal, selectedId, tableRows } =
    useAppStore(
      useShallow((state) => ({
        currentMode: state.currentMode,
        setMode: state.setMode,
        openGlobalModal: state.openGlobalModal,
        selectedId: state.selectedIds[state.currentMode] ?? "",
        tableRows: state.tableRows,
      })),
    );

  const rows = rowsInput ?? tableRows;

  const { item: selectedItem, status } = useMemo(
    () => selectActiveItemStatusFlags(rows, selectedId),
    [rows, selectedId],
  );

  const activeActions = useMemo(
    () =>
      selectedItem ? createActiveActions(selectedItem, openGlobalModal) : [],
    [openGlobalModal, selectedItem],
  );

  const executeAction = useCallback(
    async (key: string) => {
      if (!selectedItem) {
        return;
      }

      const action = activeActions.find((candidate) => candidate.key === key);

      if (action) {
        await action.execute(selectedItem);
      }
    },
    [activeActions, selectedItem],
  );

  return {
    currentMode,
    selectedItem,
    status,
    activeActions,
    isMenuVisible: Boolean(selectedItem && activeActions.length > 0),
    setMode,
    executeAction,
  };
}

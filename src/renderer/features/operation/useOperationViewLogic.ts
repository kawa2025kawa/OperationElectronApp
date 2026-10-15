// src/renderer/features/operation/useOperationViewLogic.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import type {
  JobStatus,
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { toDisplayValue } from "./operationDisplayUtils";
import { openLinkModal, openScriptModal } from "./operationModal";

export interface ViewAction {
  key: string;
  label: string;
  execute: (item: OperationViewItem) => void | Promise<void>;
}

type InfoRowField =
  | "kanriNo"
  | "workName"
  | "scheduleTime"
  | "status"
  | "startTime"
  | "endTime"
  | "comment"
  | "cycle";

type InfoRowType = "text" | "status" | "remarks";

interface InfoRowDefinition {
  field: InfoRowField;
  label: string;
  type: InfoRowType;
}

export interface InfoRowData extends InfoRowDefinition {
  value: string;
}

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

const INFO_ROW_DEFINITIONS: Record<ViewMode, InfoRowDefinition[]> = {
  operation: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "status", label: "状態", type: "status" },
    { field: "startTime", label: "開始時刻", type: "text" },
    { field: "endTime", label: "終了時刻", type: "text" },
    { field: "comment", label: "備考", type: "remarks" },
  ],
  irregular: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "scheduleTime", label: "予定時刻", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "cycle", label: "サイクル", type: "text" },
  ],
  today: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "status", label: "状態", type: "status" },
    { field: "comment", label: "備考", type: "remarks" },
  ],
};

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (item.link !== true || !Array.isArray(item.links)) return [];
  return item.links
    .filter((entry) => entry?.label?.trim() && entry?.path?.trim())
    .map((entry) => ({ key: entry.label.trim(), url: entry.path.trim() }));
}

function getManualScriptKeys(item: OperationViewItem): string[] {
  if (item.Script !== true || !Array.isArray(item.ScriptKeys)) return [];
  return item.ScriptKeys.filter(
    (entry) => entry.executionType === "manual" && entry.key?.trim(),
  ).map((entry) => entry.key.trim());
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
      execute: () => executeJcJob(useAppStore.getState(), item.kanriNo),
    });
  }

  getManualScriptKeys(item).forEach((scriptKey, index) => {
    actions.push({
      key: `script:${index}:${scriptKey}`,
      label: `Script ${scriptKey}`,
      execute: () => openScriptModal(openGlobalModal, item, scriptKey),
    });
  });

  const links = getLinkConfigs(item);
  if (links.length > 0) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => openLinkModal(openGlobalModal, links),
    });
  }

  if ("manualUrl" in item && typeof item.manualUrl === "string") {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: async () => {
        await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_MANUAL, {
          target: item.manualUrl as string,
        });
      },
    });
  }

  if ("autoManualUrl" in item && typeof item.autoManualUrl === "string") {
    actions.push({
      key: "autoManual",
      label: "AutoManual",
      execute: async () => {
        await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_MANUAL, {
          target: item.autoManualUrl as string,
        });
      },
    });
  }

  return actions;
}

function getInfoRowValue(
  field: InfoRowField,
  item: OperationViewItem,
  status: JobStatus | undefined,
): unknown {
  switch (field) {
    case "kanriNo":
      return item.kanriNo;
    case "workName":
      return item.workName;
    case "scheduleTime":
      return item.scheduledTime;
    case "status":
      return status ?? ("status" in item ? item.status : undefined);
    case "startTime":
      return "startTime" in item ? item.startTime : undefined;
    case "endTime":
      return "endTime" in item ? item.endTime : undefined;
    case "comment":
      return "comment" in item ? item.comment : undefined;
    case "cycle":
      return "cycle" in item ? item.cycle : undefined;
  }
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
      if (!selectedItem) return;
      const action = activeActions.find((a) => a.key === key);
      if (action) await action.execute(selectedItem);
    },
    [activeActions, selectedItem],
  );

  const infoRows = useMemo(
    () =>
      INFO_ROW_DEFINITIONS[currentMode].map((def) => ({
        ...def,
        value: selectedItem
          ? toDisplayValue(getInfoRowValue(def.field, selectedItem, status))
          : "",
      })),
    [currentMode, selectedItem, status],
  );

  return {
    currentMode,
    activeActions,
    infoRows,
    isMenuVisible: Boolean(selectedItem && activeActions.length > 0),
    setMode,
    executeAction,
  };
}

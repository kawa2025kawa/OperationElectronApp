import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import type { ViewMode } from "@renderer/registry/appRegistry";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { getManualUrl } from "@renderer/features/operation/helpers/entityUtils";
import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import { trpc } from "@renderer/lib/trpc";
import { getManualScriptKeys } from "@shared/config/operationScriptRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import type {
  JobStatus,
  LinkConfig,
  OperationViewItem,
  SelectedOperationItem,
} from "@shared/types/operation/operationTypes";
import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

import { toDisplayValue } from "./operationDisplayUtils";
import { openLinkModal, openScriptModal } from "./operationModal";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ViewAction {
  key: string;
  label: string;
  execute: (item: SelectedOperationItem) => void | Promise<void>;
}

type InfoRowField =
  | "kanriNo"
  | "workName"
  | "scheduleTime"
  | "status"
  | "startTime"
  | "endTime"
  | "comment";

type InfoRowType = "text" | "status" | "remarks";

interface InfoRowDefinition {
  field: InfoRowField;
  label: string;
  type: InfoRowType;
}

export interface InfoRowData extends InfoRowDefinition {
  value: string;
}

type OpenGlobalModal = AppState["openGlobalModal"];

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

const INFO_ROW_DEFINITIONS: Record<ViewMode, InfoRowDefinition[]> = {
  operation: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "startTime", label: "開始日時", type: "text" },
    { field: "endTime", label: "終了日時", type: "text" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],
  irregular: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "scheduleTime", label: "開始時刻", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "comment", label: "備考", type: "remarks" },
  ],
  today: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],
};

// -----------------------------------------------------------------------------
// Menu Actions
// -----------------------------------------------------------------------------

const isOperationMaster = (item: OperationViewItem): item is OperationMaster =>
  "jobId" in item;

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!("link" in item) || !item.link) {
    return [];
  }

  return item.link.split(",").map((entry, index) => {
    const separator = entry.indexOf(":");

    return separator === -1
      ? { key: `link${index + 1}`, url: entry }
      : {
          key: entry.slice(0, separator),
          url: entry.slice(separator + 1),
        };
  });
}

function hasManualEnabled(item: OperationViewItem): boolean {
  if (isOperationMaster(item)) {
    return item.manualUrl === "true" || item.AutoManualUrl === "true";
  }

  return "manualUrl" in item && item.manualUrl === "true";
}

function createActiveActions(
  item: SelectedOperationItem,
  openGlobalModal: OpenGlobalModal,
): ViewAction[] {
  const actions: ViewAction[] = [];

  if (isOperationMaster(item) && item.jobId) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => executeJcJob(useAppStore.getState(), item.kanriNo),
    });
  }

  if (getManualScriptKeys(item.kanriNo).length > 0) {
    actions.push({
      key: "script",
      label: "Script",
      execute: () => openScriptModal(openGlobalModal, item),
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

  if (hasManualEnabled(item)) {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: async () => {
        await trpc.system.openExternal.mutate({
          urlOrPath: getManualUrl(item.kanriNo),
        });
      },
    });
  }

  return actions;
}

// -----------------------------------------------------------------------------
// Info Rows
// -----------------------------------------------------------------------------

function getInfoRowValue(
  field: InfoRowField,
  item: SelectedOperationItem,
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
      return status;
    case "startTime":
      return item.startTime;
    case "endTime":
      return item.endTime;
    case "comment":
      return item.comment;
  }
}

function createInfoRows(
  mode: ViewMode,
  item: SelectedOperationItem | undefined,
  status: JobStatus | undefined,
): InfoRowData[] {
  return INFO_ROW_DEFINITIONS[mode].map((definition) => ({
    ...definition,
    value: item
      ? toDisplayValue(getInfoRowValue(definition.field, item, status))
      : "",
  }));
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useOperationViewLogic() {
  const { currentMode, setMode, openGlobalModal } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      setMode: state.setMode,
      openGlobalModal: state.openGlobalModal,
    })),
  );

  const { item: selectedItem, status } = useAppStore(
    selectActiveItemStatusFlags,
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

      const action = activeActions.find((item) => item.key === key);

      if (action) {
        await action.execute(selectedItem);
      }
    },
    [activeActions, selectedItem],
  );

  const infoRows = useMemo(
    () => createInfoRows(currentMode, selectedItem, status),
    [currentMode, selectedItem, status],
  );

  return {
    currentMode,
    activeActions,
    infoRows,
    isMenuVisible: Boolean(selectedItem && activeActions.length),
    setMode,
    executeAction,
  };
}

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";
import { trpc } from "@renderer/lib/trpc";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import type {
  JobStatus,
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

import { useOperationTable } from "./components/table/useOperationTable";
import { toDisplayValue } from "./operationDisplayUtils";
import { openLinkModal, openScriptModal } from "./operationModal";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

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

type OpenGlobalModal = AppState["openGlobalModal"];
type ManualUrlKey = "manualUrl" | "autoManualUrl";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const MODES: ViewMode[] = ["operation", "irregular", "today"];

const INFO_ROW_DEFINITIONS: Record<ViewMode, InfoRowDefinition[]> = {
  operation: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "startTime", label: "開始時刻", type: "text" },
    { field: "endTime", label: "終了時刻", type: "text" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],
  irregular: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "scheduleTime", label: "予定時刻", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "cycle", label: "日付ルール", type: "text" },
  ],
  today: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],
};

// -----------------------------------------------------------------------------
// Operation Helpers
// -----------------------------------------------------------------------------

function isOperationMaster(item: OperationViewItem): boolean {
  return "jobId" in item && Boolean(item.jobId);
}

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (item.link !== true || !Array.isArray(item.links)) {
    return [];
  }

  return item.links
    .filter(
      (entry) =>
        typeof entry?.label === "string" &&
        entry.label.trim().length > 0 &&
        typeof entry?.path === "string" &&
        entry.path.trim().length > 0,
    )
    .map((entry) => ({
      key: entry.label.trim(),
      url: entry.path.trim(),
    }));
}

function hasManualScript(item: OperationViewItem): boolean {
  if (item.Script !== true || !Array.isArray(item.ScriptKeys)) {
    return false;
  }

  return item.ScriptKeys.some(
    (entry) =>
      entry.executionType === "manual" &&
      typeof entry.key === "string" &&
      entry.key.trim().length > 0,
  );
}

// -----------------------------------------------------------------------------
// Manual / AutoManual
// -----------------------------------------------------------------------------

/**
 * 値が空かどうかではなく、JSON オブジェクト自身にキーがあるかを判定する。
 * manualUrl / autoManualUrl の値が空文字でも、キーが存在すればボタンを表示する。
 */
function hasOwnKey(item: OperationViewItem, key: ManualUrlKey): boolean {
  return Object.prototype.hasOwnProperty.call(item, key);
}

/**
 * キーに対応する起動先を取得する。
 * 表示判定は hasOwnKey で行うため、この関数の戻り値で表示可否を判断しない。
 */
function getManualTarget(item: OperationViewItem, key: ManualUrlKey): string {
  if (key === "manualUrl") {
    return typeof item.manualUrl === "string" ? item.manualUrl : "";
  }

  return typeof item.autoManualUrl === "string" ? item.autoManualUrl : "";
}

function createManualAction(
  key: string,
  label: string,
  target: string,
): ViewAction {
  return {
    key,
    label,
    execute: async () => {
      await trpc.system.openManual.mutate({ target });
    },
  };
}

// -----------------------------------------------------------------------------
// Action Creation
// -----------------------------------------------------------------------------

function createActiveActions(
  item: OperationViewItem,
  openGlobalModal: OpenGlobalModal,
): ViewAction[] {
  const actions: ViewAction[] = [];

  if (isOperationMaster(item)) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => executeJcJob(useAppStore.getState(), item.kanriNo),
    });
  }

  if (hasManualScript(item)) {
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

  // manualUrl キーが存在するときだけ Manual を表示する。
  if (hasOwnKey(item, "manualUrl")) {
    actions.push(
      createManualAction(
        "manual",
        "Manual",
        getManualTarget(item, "manualUrl"),
      ),
    );
  }

  // autoManualUrl キーが存在するときだけ AutoManual を表示する。
  if (hasOwnKey(item, "autoManualUrl")) {
    actions.push(
      createManualAction(
        "autoManual",
        "AutoManual",
        getManualTarget(item, "autoManualUrl"),
      ),
    );
  }

  return actions;
}

// -----------------------------------------------------------------------------
// Info Rows
// -----------------------------------------------------------------------------

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

function createInfoRows(
  mode: ViewMode,
  item: OperationViewItem | undefined,
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

export function useOperationViewLogic(rowsInput?: OperationViewItem[]) {
  const { currentMode, setMode, openGlobalModal, selectedId } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      setMode: state.setMode,
      openGlobalModal: state.openGlobalModal,
      selectedId: state.selectedIds[state.currentMode] ?? "",
    })),
  );

  const tableData = useOperationTable();
  const rows = rowsInput ?? tableData.rows;

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

  const infoRows = useMemo(
    () => createInfoRows(currentMode, selectedItem, status),
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

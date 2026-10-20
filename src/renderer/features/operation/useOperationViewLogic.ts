// src/renderer/features/operation/useOperationViewLogic.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { selectActiveItemStatusFlags } from "@renderer/store/selectors/operationSelectors";
import type { ViewMode } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import type {
  JobStatus,
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { toDisplayValue } from "./operationDisplayUtils";
import { openLinkModal, openScriptModal } from "./operationModal";
import { operationService } from "@renderer/features/operation/operationService";
import { systemIpcService } from "@renderer/services/systemIpcService";

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
  if (!Array.isArray(item.links) || item.links.length === 0) return [];
  return item.links
    .filter((entry) => entry?.label?.trim() && entry?.path?.trim())
    .map((entry) => ({ key: entry.label.trim(), url: entry.path.trim() }));
}

function createActiveActions(
  item: OperationViewItem,
  openGlobalModal: AppState["openGlobalModal"],
): ViewAction[] {
  const actions: ViewAction[] = [];

  // 1. JC アクション
  if ("jobId" in item && Boolean(item.jobId)) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: async () => {
        await operationService.executeJcJob(
          useAppStore.getState(),
          item.kanriNo,
        );
      },
    });
  }

  // 2. 手動スクリプト
  if (Array.isArray(item.ScriptKeys)) {
    item.ScriptKeys.filter(
      (entry) => entry.key?.trim() && entry.executionTypes?.includes("manual"),
    ).forEach(({ key, label }, index) => {
      const cleanKey = key.trim();
      const cleanLabel = label?.trim() || cleanKey;
      actions.push({
        key: `script:${index}:${cleanKey}`,
        label: cleanLabel,
        execute: () =>
          openScriptModal(openGlobalModal, item, cleanKey, cleanLabel),
      });
    });
  }

  // 3. リンク一覧
  const links = getLinkConfigs(item);
  if (links.length > 0) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => openLinkModal(openGlobalModal, links),
    });
  }

  // 4. マニュアル
  if (item.manualUrl && typeof item.manualUrl === "string") {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: async () => {
        await systemIpcService.openManual(item.manualUrl as string);
      },
    });
  }

  // 5. Autoマニュアル
  if (item.autoManualUrl && typeof item.autoManualUrl === "string") {
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

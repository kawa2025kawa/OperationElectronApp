// src/renderer/features/operation/hooks/useOperationViewLogic.ts

import { createElement, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { operationService } from "@renderer/features/operation/service/operationService";
import {
  openLinkModal,
  openPdfUploadModal,
  openScriptModal,
} from "@renderer/features/operation/components/modal/operationModal";
import { GmailDraftContent } from "@renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent";
import { rdpIpcService } from "@renderer/services/rdpIpcService";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore, type AppState } from "@renderer/store";
import { selectActiveItemStatusFlags } from "@renderer/store/selectors/operationSelectors";
import { normalizeKanriNo } from "@shared/utils/statusUtils";

import type {
  OperationViewItem,
  LinkConfig,
} from "@shared/types/operation/operationTypes";

export interface ViewAction {
  readonly key: string;
  readonly label: string;
  readonly execute: (item: OperationViewItem) => void | Promise<void>;
}

const GMAIL_MODAL_CONFIG = {
  title: "Gmail",
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** 値が真偽値 true（または文字列 "true" / "1"）であるかを判定 */
function isTruthyFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }

  return false;
}

/** 値が空文字・ハイフン "-" 以外かを判定 */
function isValidValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const str = String(value).trim();
  return str !== "" && str !== "-";
}

/** 値が単なるフラグ（true / false）ではなく、固有のターゲット指定文字列かを判定 */
function isSpecificTarget(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return (
    normalized !== "" &&
    normalized !== "-" &&
    normalized !== "true" &&
    normalized !== "false" &&
    normalized !== "1" &&
    normalized !== "0"
  );
}

/** 有効なリンク一覧を取得 */
function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!Array.isArray(item.links)) {
    return [];
  }

  return item.links.flatMap((entry) => {
    const label = entry?.label?.trim();
    const path = entry?.path?.trim();

    return label && path && path !== "-" ? [{ key: label, url: path }] : [];
  });
}

/**
 * 選択中アイテムの状態に基づき、表示対象のアクションボタン一覧を生成する
 */
function createActiveActions(
  item: OperationViewItem,
  openGlobalModal: AppState["openGlobalModal"],
): ViewAction[] {
  const actions: ViewAction[] = [];
  const rawItem = item as unknown as Record<string, unknown>;
  const kanriNo = normalizeKanriNo(item.kanriNo);

  // RDPに登録されているキーを取得
  const rdpKeys = new Set(
    (Array.isArray(item.RdpKeys) ? item.RdpKeys : []).map((rdp) =>
      rdp?.key?.trim(),
    ),
  );

  // 1. Gmail: bool値がtrueなら表示
  const isGmailEnabled =
    isTruthyFlag(rawItem.isGmail) || isTruthyFlag(rawItem.gmail);

  if (isGmailEnabled) {
    actions.push({
      key: "gmail",
      label: "Gmail",
      execute: () => {
        openGlobalModal(createElement(GmailDraftContent), GMAIL_MODAL_CONFIG);
      },
    });
  }

  // 2. JC: 値が空もしくは-以外は表示
  const jobId = item.jobId;

  if (isValidValue(jobId)) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => operationService.executeJcJob(kanriNo),
    });
  }

  // 3. Script / PDF: RDPと重複するキーは表示しない
  if (Array.isArray(item.ScriptKeys)) {
    item.ScriptKeys.forEach((script, index) => {
      const key = script?.key?.trim();
      const label = script.label?.trim() || key;

      if (
        !key ||
        rdpKeys.has(key) ||
        !script.executionTypes?.includes("manual")
      ) {
        return;
      }

      const isPdfAction = Boolean(item.isPdfUpload);

      actions.push({
        key: `script:${index}:${key}`,
        label,
        execute: () => {
          if (isPdfAction) {
            openPdfUploadModal(openGlobalModal);
          } else {
            openScriptModal(openGlobalModal, item, key);
          }
        },
      });
    });
  }

  // 4. RDP: executionTypes に manual が含まれる場合のみ表示
  if (Array.isArray(item.RdpKeys)) {
    item.RdpKeys.forEach((rdp, index) => {
      const key = rdp?.key?.trim();
      const label = rdp.label?.trim() || key;

      if (!key || !rdp.executionTypes?.includes("manual")) {
        return;
      }

      actions.push({
        key: `rdp:${index}:${key}`,
        label,
        execute: async () => {
          try {
            await rdpIpcService.startSession(key);
          } catch (error: unknown) {
            toast.error(`RDP起動エラー: ${getErrorMessage(error)}`);
          }
        },
      });
    });
  }

  // 5. Link: 値が空もしくは-以外は表示
  const links = getLinkConfigs(item);

  if (links.length > 0) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => openLinkModal(openGlobalModal, links),
    });
  }

  // 6. Manual: bool値がtrueなら表示 (isAuto: false)
  const isManualEnabled =
    isTruthyFlag(rawItem.isManual) || isTruthyFlag(item.manualUrl);

  if (isManualEnabled) {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: async () => {
        const target = isSpecificTarget(item.manualUrl)
          ? item.manualUrl
          : kanriNo;

        await systemIpcService.openManual(target, false);
      },
    });
  }

  // 7. AutoManual: bool値がtrueなら表示 (isAuto: true)
  const isAutoManualEnabled =
    isTruthyFlag(rawItem.isAutoManual) || isTruthyFlag(item.autoManualUrl);

  if (isAutoManualEnabled) {
    actions.push({
      key: "autoManual",
      label: "Auto Manual",
      execute: async () => {
        const target = isSpecificTarget(item.autoManualUrl)
          ? item.autoManualUrl
          : kanriNo;

        await systemIpcService.openManual(target, true);
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
    selectedId,
    selectedItem,
    status,
    activeActions,
    isMenuVisible: Boolean(selectedItem && activeActions.length > 0),
    setMode,
    executeAction,
  };
}

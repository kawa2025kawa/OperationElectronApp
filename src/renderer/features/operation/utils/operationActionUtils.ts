// src/renderer/features/operation/utils/operationActionUtils.ts

import { toast } from "sonner";

import {
  openGmailModal,
  openLinkModal,
  openPdfUploadModal,
  openScriptModal,
} from "@renderer/features/operation/components/modal/operationModal";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { AppState } from "@renderer/store";
import { isRunningStatus, normalizeKanriNo } from "@shared/utils/statusUtils";
import type {
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

export interface OperationActionItem {
  readonly key: string;
  readonly label: string;
  readonly execute: (item: OperationViewItem) => void | Promise<void>;
}

export interface BuildOperationMenuActionsOptions {
  readonly openGlobalModal: AppState["openGlobalModal"];
  readonly onRefreshTable?: () => void | Promise<void>;
}

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
 * 選択中アイテムの状態に基づき、メニューに表示するアクションボタン一覧を生成する
 */
export function buildOperationMenuActions(
  item: OperationViewItem,
  options: BuildOperationMenuActionsOptions,
): OperationActionItem[] {
  const { openGlobalModal, onRefreshTable } = options;
  const actions: OperationActionItem[] = [];
  const rawItem = item as unknown as Record<string, unknown>;
  const kanriNo = normalizeKanriNo(item.kanriNo);
  const isRunning = isRunningStatus(item.status);

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
      execute: () => openGmailModal(openGlobalModal),
    });
  }

  // 2. JC: 値が空もしくは-以外は表示
  if (isValidValue(item.jobId)) {
    const jobId = String(item.jobId).trim();

    actions.push({
      key: "jc",
      label: "JC",
      execute: () => {
        void operationService
          .executeJcJob(kanriNo, { jobId, onSuccess: onRefreshTable })
          .catch(() => undefined);
      },
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
        label: isRunning ? `${label} (処理中)` : label,
        execute: () => {
          if (isRunning) {
            toast.info("バックグラウンド処理中のため実行できません");
            return;
          }

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
        execute: () => {
          void operationService.startRdpSession(key).catch(() => undefined);
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

  // 6. Manual: bool値がtrue、または固有ターゲット指定があれば表示 (isAuto: false)
  const manualSource =
    item.manualUrl ?? rawItem.ManualUrl ?? rawItem.isManual ?? rawItem.manual;
  const isManualEnabled =
    isTruthyFlag(manualSource) || isSpecificTarget(manualSource);

  if (isManualEnabled) {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: () => {
        const target = isSpecificTarget(manualSource) ? manualSource : kanriNo;
        void operationService.openManual(target, false).catch(() => undefined);
      },
    });
  }

  // 7. AutoManual: bool値がtrue、または固有ターゲット指定があれば表示 (isAuto: true)
  const autoManualSource =
    item.autoManualUrl ??
    rawItem.AutoManualUrl ??
    rawItem.isAutoManual ??
    rawItem.autoManual;
  const isAutoManualEnabled =
    isTruthyFlag(autoManualSource) || isSpecificTarget(autoManualSource);

  if (isAutoManualEnabled) {
    actions.push({
      key: "autoManual",
      label: "Auto Manual",
      execute: () => {
        const target = isSpecificTarget(autoManualSource)
          ? autoManualSource
          : kanriNo;
        void operationService.openManual(target, true).catch(() => undefined);
      },
    });
  }

  return actions;
}

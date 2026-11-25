// src/renderer/features/operation/utils/operationActionUtils.ts

import { toast } from "sonner";

import {
  openGmailModal,
  openLinkModal,
  openPdfUploadModal,
  openScriptModal,
} from "@renderer/components/ui/modal/modalLaunchers";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { AppState } from "@renderer/store";
import { isRunningStatus, normalizeKanriNo } from "@shared/utils/sharedUtils";
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

const FALSY_OR_EMPTY_TOKENS = new Set([
  "",
  "-",
  "true",
  "false",
  "1",
  "0",
]);

/** 値が真偽値 true（または文字列 "true" / "1"）であるかを判定 */
function isTruthyFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}

/** 値が空文字・ハイフン "-" 以外かを判定 */
function isValidValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const str = String(value).trim();
  return str !== "" && str !== "-";
}

/** 値が単なるフラグ（true / false）ではなく、固有のターゲット指定文字列かを判定 */
function isSpecificTarget(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return !FALSY_OR_EMPTY_TOKENS.has(value.trim().toLowerCase());
}

/** 有効なリンク一覧を取得 */
function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!Array.isArray(item.links)) return [];

  return item.links.flatMap((entry) => {
    const label = entry?.label?.trim();
    const path = entry?.path?.trim();
    return label && path && path !== "-" ? [{ key: label, url: path }] : [];
  });
}

/** Manual / AutoManual 共通アクション生成 */
function createManualAction(
  key: "manual" | "autoManual",
  label: string,
  source: unknown,
  kanriNo: string,
  isAuto: boolean,
): OperationActionItem | null {
  if (!isTruthyFlag(source) && !isSpecificTarget(source)) {
    return null;
  }

  const target = isSpecificTarget(source) ? source : kanriNo;
  return {
    key,
    label,
    execute: () => {
      void operationService.openManual(target, isAuto).catch(() => undefined);
    },
  };
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

  const rdpKeys = new Set(
    (Array.isArray(item.RdpKeys) ? item.RdpKeys : []).map((rdp) =>
      rdp?.key?.trim(),
    ),
  );

  // 1. Gmail
  if (isTruthyFlag(rawItem.isGmail) || isTruthyFlag(rawItem.gmail)) {
    actions.push({
      key: "gmail",
      label: "Gmail",
      execute: () => openGmailModal(openGlobalModal),
    });
  }

  // 2. JC
  if (isValidValue(item.jobId)) {
    const jobId = String(item.jobId).trim();
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => {
        void operationService
          .executeJcJob(kanriNo, {
            jobId,
            workType: item.workType,
            onSuccess: onRefreshTable,
          })
          .catch(() => undefined);
      },
    });
  }

  // 3. Script / PDF（RDPと重複するキーは除外）
  if (Array.isArray(item.ScriptKeys)) {
    item.ScriptKeys.forEach((script, index) => {
      const key = script?.key?.trim();
      if (
        !key ||
        rdpKeys.has(key) ||
        !script.executionTypes?.includes("manual")
      ) {
        return;
      }

      const label = script.label?.trim() || key;
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

  // 4. RDP
  if (Array.isArray(item.RdpKeys)) {
    item.RdpKeys.forEach((rdp, index) => {
      const key = rdp?.key?.trim();
      if (!key || !rdp.executionTypes?.includes("manual")) return;

      actions.push({
        key: `rdp:${index}:${key}`,
        label: rdp.label?.trim() || key,
        execute: () => {
          void operationService.startRdpSession(key).catch(() => undefined);
        },
      });
    });
  }

  // 5. Link
  const links = getLinkConfigs(item);
  if (links.length > 0) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => openLinkModal(openGlobalModal, links),
    });
  }

  // 6. Manual / 7. AutoManual
  const manualAction = createManualAction(
    "manual",
    "Manual",
    item.manualUrl ?? rawItem.ManualUrl ?? rawItem.isManual ?? rawItem.manual,
    kanriNo,
    false,
  );
  if (manualAction) actions.push(manualAction);

  const autoManualAction = createManualAction(
    "autoManual",
    "Auto Manual",
    item.autoManualUrl ??
      rawItem.AutoManualUrl ??
      rawItem.isAutoManual ??
      rawItem.autoManual,
    kanriNo,
    true,
  );
  if (autoManualAction) actions.push(autoManualAction);

  return actions;
}

// src/renderer/hooks/useModalFooterSync.ts

import { useEffect, useMemo } from "react";
import { useAppStore } from "@renderer/store";
import type { ModalAction, ModalConfig } from "@renderer/types/modal";

interface UseModalFooterSyncOptions {
  /** モーダル上部に表示するメッセージ（undefined を渡すと既存値を維持、null でクリア） */
  readonly message?: ModalConfig["message"];
  /** 処理中フラグ（閉じるボタン等の無効化にも連動） */
  readonly isProcessing?: boolean;
  /** true の場合はフッターのアクションボタンを空にする（完了後など） */
  readonly hideActions?: boolean;
  /** キャンセルボタンのラベル（既定: "キャンセル"） */
  readonly cancelLabel?: string;
  /** キャンセルボタンの無効化 */
  readonly isCancelDisabled?: boolean;
  /** 実行ボタンのラベル */
  readonly executeLabel: string;
  /** 実行ボタンの無効化 */
  readonly isExecuteDisabled?: boolean;
  /** 実行ボタン押下時のハンドラ */
  readonly onExecute: () => void | Promise<void>;
}

/**
 * グローバルモーダルのメッセージおよび標準フッターアクション（キャンセル / 実行）を同期する共通フック
 */
export function useModalFooterSync({
  message,
  isProcessing = false,
  hideActions = false,
  cancelLabel = "キャンセル",
  isCancelDisabled = false,
  executeLabel,
  isExecuteDisabled = false,
  onExecute,
}: UseModalFooterSyncOptions): void {
  const updateModalConfig = useAppStore((state) => state.updateModalConfig);
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);

  const rightActions = useMemo<ModalAction[]>(() => {
    if (hideActions) {
      return [];
    }

    return [
      {
        id: "cancel",
        label: cancelLabel,
        onClick: closeGlobalModal,
        disabled: isCancelDisabled,
      },
      {
        id: "execute",
        label: executeLabel,
        onClick: onExecute,
        disabled: isExecuteDisabled,
        variant: "default",
      },
    ];
  }, [
    hideActions,
    cancelLabel,
    closeGlobalModal,
    isCancelDisabled,
    executeLabel,
    onExecute,
    isExecuteDisabled,
  ]);

  useEffect(() => {
    const patch: Partial<ModalConfig> = {
      isProcessing,
      rightActions,
    };

    if (message !== undefined) {
      patch.message = message;
    }

    updateModalConfig(patch);
  }, [message, isProcessing, rightActions, updateModalConfig]);
}
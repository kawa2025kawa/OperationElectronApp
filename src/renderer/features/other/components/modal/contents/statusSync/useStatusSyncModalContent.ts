// src/renderer/features/other/components/modal/contents/statusSync/useStatusSyncModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { StatusSyncPreviewResult } from "@shared/types/electron/ipcTypes";
import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";
import { useAppStore } from "@renderer/store";

export type StatusSyncMode = "save" | "load";
type SyncExecutionState = "idle" | "completed" | "error";

export interface StatusSyncInfoMessage {
  text: string;
  type: "info" | "success" | "error";
}

const DATE_TIME_FORMAT = "yyyy/MM/dd HH:mm:ss";

function formatNow(): string {
  return format(new Date(), DATE_TIME_FORMAT);
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useStatusSyncModalContent(mode: StatusSyncMode) {
  const isSave = mode === "save";

  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const fetchTableData = useAppStore((state) => state.fetchTableData);
  const fetchStatusSummary = useAppStore((state) => state.fetchStatusSummary);
  const applyCenterFlags = useAppStore((state) => state.applyCenterFlags);
  const currentMode = useAppStore((state) => state.currentMode);
  const familyName = useAppStore((state) => state.familyName);
  const userEmail = useAppStore((state) => state.userEmail);

  const operatorName = familyName?.trim() || userEmail?.trim() || "担当者";

  // 共通実行ステート
  const [executionState, setExecutionState] =
    useState<SyncExecutionState>("idle");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [resultDetailText, setResultDetailText] = useState<string | null>(null);

  // SAVE 用ステート
  const [currentTimeText, setCurrentTimeText] = useState<string>(() =>
    formatNow(),
  );
  const [handoverNote, setHandoverNote] = useState<string>("");
  const [currentActiveFlags, setCurrentActiveFlags] =
    useState<ActiveFlags>(DEFAULT_ACTIVE_FLAGS);

  // LOAD 用ステート
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(!isSave);
  const [preview, setPreview] = useState<StatusSyncPreviewResult | null>(null);
  const [previewErrorText, setPreviewErrorText] = useState<string | null>(null);
  const [loadScreenOpenedAt] = useState<string>(() => formatNow());

  const isFinished = executionState !== "idle";

  // SAVE 画面の現在時刻更新 & 現在の ActiveFlags 取得
  useEffect(() => {
    if (!isSave || isFinished) return;

    let isMounted = true;

    void operationService
      .getActiveFlags()
      .then((flags) => {
        if (isMounted) {
          setCurrentActiveFlags(flags);
        }
      })
      .catch((error: unknown) => {
        console.error("[StatusSyncModal] getActiveFlags failed:", error);
      });

    const timer = window.setInterval(() => {
      setCurrentTimeText(formatNow());
    }, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [isSave, isFinished]);

  // LOAD 画面表示時にスプレッドシートから前回の保存情報を取得
  useEffect(() => {
    if (isSave) return;

    let isMounted = true;

    void operationService
      .previewStatusSyncFromSheet()
      .then((result) => {
        if (isMounted) {
          setPreview(result);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return;

        console.error("[StatusSyncModal] preview failed:", error);
        setPreviewErrorText(
          toErrorMessage(error, "前回の引き継ぎ情報の取得に失敗しました。"),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSave]);

  const handleExecute = useCallback(async () => {
    if (isExecuting || isFinished) return;

    setIsExecuting(true);
    setResultDetailText(null);

    try {
      if (isSave) {
        const result = await operationService.saveStatusesToSheet({
          operatorName,
          handoverNote,
        });

        setCurrentTimeText(result.savedAt);
        setResultDetailText(
          `保存完了（担当: ${result.operatorName} / 保存日時: ${result.savedAt}）`,
        );
        setExecutionState("completed");
      } else {
        const result = await operationService.loadStatusesFromSheet();

        useAppStore.setState({ isPolling: false });

        if (result.metadata?.activeFlags) {
          applyCenterFlags(result.metadata.activeFlags);
        }

        await fetchTableData(currentMode, true);
        await fetchStatusSummary();

        setResultDetailText(
          `復元完了（Status・有効フラグを反映 / 復元日時: ${result.loadedAt}）`,
        );
        setExecutionState("completed");
      }
    } catch (error) {
      console.error(`[StatusSyncModal] ${mode} failed:`, error);
      setResultDetailText(
        toErrorMessage(
          error,
          isSave
            ? "引き継ぎ情報の保存に失敗しました。"
            : "前回のStatusの復元に失敗しました。",
        ),
      );
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
    }
  }, [
    isExecuting,
    isFinished,
    isSave,
    operatorName,
    handoverNote,
    applyCenterFlags,
    fetchTableData,
    fetchStatusSummary,
    currentMode,
    mode,
  ]);

  const canExecute = isSave
    ? !isExecuting && !isFinished
    : !isExecuting &&
      !isFinished &&
      !isLoadingPreview &&
      !previewErrorText &&
      Boolean(preview?.hasData);

  const infoMessage: StatusSyncInfoMessage = (() => {
    if (executionState === "completed") {
      return {
        text:
          resultDetailText ??
          (isSave
            ? "引き継ぎ情報の保存が完了しました。"
            : "前回のStatusの復元が完了しました。"),
        type: "success",
      };
    }

    if (executionState === "error") {
      return {
        text:
          resultDetailText ??
          (isSave
            ? "引き継ぎ情報の保存中にエラーが発生しました。"
            : "前回のStatusの復元中にエラーが発生しました。"),
        type: "error",
      };
    }

    if (!isSave && previewErrorText) {
      return {
        text: previewErrorText,
        type: "error",
      };
    }

    return {
      text: isSave
        ? "現在のStatus状態・有効フラグ（1C/2C/3C）・引き継ぎ事項をスプレッドシートへ保存します。"
        : "スプレッドシートに保存された前回のStatus状態・有効フラグ（1C/2C/3C）を復元します。",
      type: "info",
    };
  })();

  return {
    state: {
      isSave,
      operatorName,
      currentTimeText,
      currentActiveFlags,
      handoverNote,
      isLoadingPreview,
      preview,
      loadScreenOpenedAt,
      isExecuting,
      isFinished,
      isExecuteDisabled: !canExecute,
      infoMessage,
    },
    actions: {
      setHandoverNote,
      handleExecute,
      handleClose: closeGlobalModal,
    },
  };
}

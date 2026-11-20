// src/renderer/features/other/components/modal/contents/statusSync/useStatusSyncModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { operationService } from "@renderer/features/operation/service/operationService";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { useAppStore } from "@renderer/store";
import { toErrorMessage } from "@renderer/utils/errorUtils";
import type { StatusSyncPreviewResult } from "@shared/types/electron/ipcTypes";

export type StatusSyncMode = "save" | "load";

interface StatusSyncInfoMessage {
  text: string;
  type: "info" | "success" | "error";
}

const formatNow = () => format(new Date(), "yyyy/MM/dd HH:mm:ss");

function useSyncRunner(params: {
  initialText: string;
  executeLabel: string;
  busyLabel: string;
  errorFallback: string;
  canExecute?: boolean;
  action: () => Promise<string>;
}) {
  const {
    initialText,
    executeLabel,
    busyLabel,
    errorFallback,
    canExecute = true,
    action,
  } = params;

  const [isExecuting, setIsExecuting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [infoMessage, setInfoMessage] = useState<StatusSyncInfoMessage>({
    text: initialText,
    type: "info",
  });

  const execute = useCallback(async () => {
    if (isExecuting || isFinished) return;
    setIsExecuting(true);
    try {
      setInfoMessage({ text: await action(), type: "success" });
    } catch (error) {
      setInfoMessage({
        text: toErrorMessage(error, errorFallback),
        type: "error",
      });
    } finally {
      setIsExecuting(false);
      setIsFinished(true);
    }
  }, [isExecuting, isFinished, action, errorFallback]);

  useModalFooterSync({
    message: undefined,
    isProcessing: isExecuting,
    hideActions: isFinished,
    isCancelDisabled: isExecuting,
    executeLabel: isExecuting ? busyLabel : executeLabel,
    isExecuteDisabled: !canExecute || isExecuting,
    onExecute: execute,
  });

  return { isLocked: isExecuting || isFinished, infoMessage, setInfoMessage };
}

export function useStatusSyncSave() {
  const operatorName = useAppStore(
    (s) => s.familyName?.trim() || s.userEmail?.trim() || "担当者",
  );
  const [currentTimeText, setCurrentTimeText] = useState(formatNow);
  const [handoverNote, setHandoverNote] = useState("");

  const runner = useSyncRunner({
    initialText:
      "現在のStatus状態・引き継ぎ事項をスプレッドシートへ保存します。",
    executeLabel: "SAVE",
    busyLabel: "保存中...",
    errorFallback: "引き継ぎ情報の保存に失敗しました。",
    action: async () => {
      const res = await operationService.saveStatusesToSheet({
        operatorName,
        handoverNote,
      });
      setCurrentTimeText(res.savedAt);
      return `保存完了（担当: ${res.operatorName} / 保存日時: ${res.savedAt}）`;
    },
  });

  useEffect(() => {
    if (runner.isLocked) return;
    const id = window.setInterval(() => setCurrentTimeText(formatNow()), 1000);
    return () => window.clearInterval(id);
  }, [runner.isLocked]);

  return {
    operatorName,
    currentTimeText,
    handoverNote,
    setHandoverNote,
    ...runner,
  };
}

export function useStatusSyncLoad() {
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [preview, setPreview] = useState<StatusSyncPreviewResult | null>(null);

  const runner = useSyncRunner({
    initialText: "スプレッドシートに保存された前回のStatus状態を復元します。",
    executeLabel: "LOAD",
    busyLabel: "読込中...",
    errorFallback: "前回のStatusの復元に失敗しました。",
    canExecute: !isLoadingPreview && Boolean(preview?.hasData),
    action: async () => {
      const res = await operationService.loadStatusesFromSheet();
      const store = useAppStore.getState();
      useAppStore.setState({ isPolling: false });
      if (res.metadata?.activeFlags) {
        store.applyCenterFlags(res.metadata.activeFlags);
      }
      await store.fetchTableData(store.currentMode, true);
      await store.fetchStatusSummary();
      return `復元完了（Statusを反映 / 復元日時: ${res.loadedAt}）`;
    },
  });

  const { setInfoMessage } = runner;
  useEffect(() => {
    let active = true;
    void operationService
      .previewStatusSyncFromSheet()
      .then((res) => active && setPreview(res))
      .catch(
        (err: unknown) =>
          active &&
          setInfoMessage({
            text: toErrorMessage(
              err,
              "前回の引き継ぎ情報の取得に失敗しました。",
            ),
            type: "error",
          }),
      )
      .finally(() => active && setIsLoadingPreview(false));
    return () => {
      active = false;
    };
  }, [setInfoMessage]);

  return { isLoadingPreview, preview, ...runner };
}

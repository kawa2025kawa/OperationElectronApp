// src/renderer/hooks/useStatusToast.ts

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "@shared/store/index";
import type { JobStatus } from "@shared/types/operationType";
import type { OperationItem } from "@shared/types/operationType";

type PendingToast = {
  kanriNo: string;
  status: string;
  displayName: string;
};

const BATCH_DELAY = 500;
const TARGET_STATUSES: JobStatus[] = ["success", "ready", "error"];
const prevMap = new Map<string, string>();

export const useStatusToast = () => {
  const isPolling = useAppStore((s) => s.isPolling);
  const pending = useRef<PendingToast[]>([]);
  const timer = useRef<number | null>(null);

  // ポーリング1周目（開始直後）のトースト通知を制御するフラグ
  const isFirstLoopRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isPolling) {
      // ポーリングが停止したらフラグと保持マップをリセット
      isFirstLoopRef.current = true;
      prevMap.clear();
      return;
    }

    let cleanup: (() => void) | undefined;

    // 1周目のループ処理時間を考慮し、最初のステータス取得群を通過した後に通知を有効化（約5秒後にフラグ解除）
    const firstLoopTimer = window.setTimeout(() => {
      isFirstLoopRef.current = false;
    }, 5000);

    try {
      cleanup = window.electronAPI.on?.(
        "operationStatusUpdated",
        (...args: unknown[]) => {
          const payload = args[0] as { status?: OperationItem };
          const update = payload?.status;
          if (!update) return;

          const kanriNo = String(update.kanriNo || "");
          if (!kanriNo) return;

          const currentStatus = update.status as JobStatus | undefined;
          if (!currentStatus) return;

          const comment = update.comment || "";
          const prevStatus = prevMap.get(kanriNo);

          // 状態のマップを更新
          if (comment.includes(" ")) {
            prevMap.set(kanriNo, currentStatus);
            return;
          }

          if (currentStatus === prevStatus) return;
          prevMap.set(kanriNo, currentStatus);

          // 1周目（開始直後）なら通知をスキップして終了
          if (isFirstLoopRef.current) return;

          if (!TARGET_STATUSES.includes(currentStatus)) return;

          const state = useAppStore.getState();
          const item =
            state.operationEntities[kanriNo] ??
            state.irregularEntities[kanriNo];
          const displayName = item?.workName ?? "";

          pending.current.push({
            kanriNo,
            status: currentStatus,
            displayName,
          });

          if (timer.current) return;

          timer.current = window.setTimeout(() => {
            flush(pending.current);
            pending.current = [];
            timer.current = null;
          }, BATCH_DELAY);
        },
      );
    } catch (error) {
      console.error("[Toast] Failed to setup status toast listener:", error);
    }

    return () => {
      cleanup?.();
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      window.clearTimeout(firstLoopTimer);
    };
  }, [isPolling]);
};

const flush = (list: PendingToast[]) => {
  if (list.length === 0) return;

  if (list.length === 1) {
    const t = list[0];
    const message = `${t.kanriNo}.${t.displayName}  ${t.status}`;
    if (t.status === "success") toast.success(message);
    else if (t.status === "error") toast.error(message);
    else toast.info(message);
    return;
  }

  const hasError = list.some((t) => t.status === "error");
  const first = list[0];
  const message = `${first.kanriNo}.${first.displayName} 他 ${list.length - 1} 件`;

  if (hasError) toast.error(message);
  else toast.success(message);
};

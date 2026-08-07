// src/renderer/features/operation/components/modal/contents/jcModal/useJcModalLogic.ts

import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import type { OperationItem } from "@shared/types/operationType";

export const useJcModalLogic = () => {
  const [isExecuting, setIsExecuting] = useState(false);

  const { item, isError, isSuccess } = useAppStore(
    useShallow(selectActiveItemStatusFlags),
  );

  const { runJcJob, updateItemStatus } = useAppStore(
    useShallow((state) => ({
      runJcJob: state.runJcJob,
      updateItemStatus: state.updateItemStatus,
    })),
  );

  /**
   * JC実行
   */
  const handleExecute = useCallback(async () => {
    const kanriNo = item?.kanriNo;

    if (!kanriNo) {
      console.warn("[JC Modal] kanriNo missing");

      return;
    }

    setIsExecuting(true);

    try {
      await runJcJob(kanriNo);
    } catch (error) {
      console.error("[JC Modal] execute failed", error);
    } finally {
      setIsExecuting(false);
    }
  }, [item?.kanriNo, runJcJob]);

  /**
   * エラー再実行
   */
  const handleRetry = useCallback(() => {
    if (!item) {
      return;
    }

    const resetStatus: OperationItem = {
      ...item,
      status: "ready",
      comment: "",
    };

    updateItemStatus(resetStatus);
  }, [item, updateItemStatus]);

  return {
    item,

    isExecuting,
    isError,
    isSuccess,

    handleExecute,
    handleRetry,
  };
};

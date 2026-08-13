// src/renderer/features/operation/components/modal/jcModal/useJcModalLogic.ts

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";

export const useJcModalLogic = () => {
  const { item, isExecuting, isError, isSuccess, runJcJob } = useAppStore(
    useShallow((state) => {
      const flags = selectActiveItemStatusFlags(state);

      return {
        item: flags.item,
        isExecuting: flags.isExecuting,
        isError: flags.isError,
        isSuccess: flags.isSuccess,
        runJcJob: state.runJcJob,
      };
    }),
  );

  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      console.warn("[JC Modal] already executing");
      return;
    }

    const kanriNo = item?.kanriNo;

    if (!kanriNo) {
      console.warn("[JC Modal] kanriNo is missing");
      return;
    }

    try {
      await runJcJob(kanriNo);
    } catch (error) {
      console.error("[JC Modal] execute failed", error);
    }
  }, [isExecuting, item?.kanriNo, runJcJob]);

  return {
    item,
    isExecuting,
    isError,
    isSuccess,
    handleExecute,
  };
};

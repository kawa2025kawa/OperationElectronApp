// src/renderer/features/operation/components/modal/contents/scriptModal/useScriptModalLogic.ts

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { useAppStore, type AppState } from "@shared/store";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";

export const useScriptModalLogic = () => {
  const { item, isExecuting, isError } = useAppStore(
    useShallow(selectActiveItemStatusFlags),
  );

  const { runScriptJob, importCsv, updateItemStatus, setGlobalProcessing } =
    useAppStore(
      useShallow((state: AppState) => ({
        runScriptJob: state.runScriptJob,
        importCsv: state.importCsv,
        updateItemStatus: state.updateItemStatus,
        setGlobalProcessing: state.setGlobalProcessing,
      })),
    );

  const [csvFiles, setCsvFiles] = useState<File[]>([]);

  const requiresFile = item?.requiresFile === true;

  const isPrimaryDisabled = requiresFile && csvFiles.length === 0;

  const handleExecute = useCallback(async () => {
    console.log("[useScriptModalLogic] handleExecute start", {
      kanriNo: item?.kanriNo,
      csvFiles,
      requiresFile,
    });

    if (!item?.kanriNo) {
      console.log(
        "[useScriptModalLogic] handleExecute aborted: kanriNo is missing",
        { item },
      );
      return;
    }

    try {
      console.log("[useScriptModalLogic] setGlobalProcessing: true");
      setGlobalProcessing(true, "スクリプト実行中...");

      if (csvFiles.length > 0) {
        console.log("[useScriptModalLogic] importCsv start", csvFiles);
        await importCsv(csvFiles);
        console.log("[useScriptModalLogic] importCsv success");
      }

      console.log("[useScriptModalLogic] runScriptJob start", item.kanriNo);
      await runScriptJob(item.kanriNo);
      console.log("[useScriptModalLogic] runScriptJob success");
    } catch (error: unknown) {
      console.error("[useScriptModalLogic] execute error:", error);

      const message =
        error instanceof Error ? error.message : "スクリプト実行に失敗しました";

      toast.error(message);
    } finally {
      console.log("[useScriptModalLogic] setGlobalProcessing: false");
      setGlobalProcessing(false);
    }
  }, [item?.kanriNo, csvFiles, importCsv, runScriptJob, setGlobalProcessing]);

  const handleRetry = useCallback(() => {
    console.log("[useScriptModalLogic] handleRetry start", { item });

    if (!item) {
      console.log("[useScriptModalLogic] handleRetry aborted: item is missing");
      return;
    }

    const resetStatus: OperationItem = {
      ...item,
      status: JOB_STATUS.READY,
      comment: "",
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      expectedStartTime: item.expectedStartTime ?? null,
      expectedEndTime: item.expectedEndTime ?? null,
      substatus: item.substatus ?? null,
    };

    console.log("[useScriptModalLogic] updateItemStatus", resetStatus);
    updateItemStatus(resetStatus);
  }, [item, updateItemStatus]);

  return {
    item,

    csvFiles,
    setCsvFiles,

    requiresFile,
    isPrimaryDisabled,

    isExecuting,
    isError,

    handleExecute,
    handleRetry,
  };
};

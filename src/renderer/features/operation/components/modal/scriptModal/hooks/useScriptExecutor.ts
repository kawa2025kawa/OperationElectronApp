import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { JobResult } from "@shared/types/operation";
import { useAppStore } from "@renderer/store";

export type ExecutionState = "idle" | "completed" | "error";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useScriptExecutor() {
  const { runScriptJob } = useAppStore(
    useShallow((state) => ({
      runScriptJob: state.runScriptJob,
    })),
  );

  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCheckingE5, setIsCheckingE5] = useState(false);

  const executeJob = useCallback(
    async (kanriNo: string, filePaths?: string[]) => {
      if (!kanriNo || isExecuting) return;

      setIsExecuting(true);
      try {
        const result = await runScriptJob(
          kanriNo,
          filePaths && filePaths.length > 0 ? filePaths : undefined,
        );
        setExecutionResult(result);
        setExecutionState("completed");
      } catch (error) {
        setExecutionResult({ message: getErrorMessage(error) });
        setExecutionState("error");
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting, runScriptJob],
  );

  const checkE5Data = useCallback(async () => {
    setIsCheckingE5(true);
    try {
      const result = await runScriptJob("E5_CHECK");
      setExecutionResult(result);
      setExecutionState("completed");
    } catch (error) {
      setExecutionResult({ message: getErrorMessage(error) });
      setExecutionState("error");
    } finally {
      setIsCheckingE5(false);
    }
  }, [runScriptJob]);

  const resetExecution = useCallback(() => {
    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

  return {
    executionState,
    executionResult,
    isExecuting,
    isCheckingE5,
    executeJob,
    checkE5Data,
    resetExecution,
  };
}

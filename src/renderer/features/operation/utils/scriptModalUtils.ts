// src/renderer/features/operation/utils/scriptModalUtils.ts

import {
  toResolvedFileItem,
  type ResolvedFileItem,
} from "@renderer/utils/rendererUtils";
import type { JobResult } from "@shared/types/operation/operationTypes";

const SCRIPT_MODAL_MESSAGES = {
  CONFIRM_IDLE: "実行しますか？",
  SUCCESS: "正常終了しました",
  DIFFERENCE: "差分あり",
  NEEDS_ACTION: "要対応",
  ERROR: "エラーが発生しました",
} as const;

export const SCRIPT_MODAL_LABELS = {
  CANCEL_BUTTON: "キャンセル",
  EXECUTE_BUTTON: "実行",
  EXECUTING_BUTTON: "実行中...",
  DEFAULT_ARTIFACT_NAME: "成果物",
} as const;

export type ScriptFileItem = ResolvedFileItem;

export type ScriptExecutionState =
  | "idle"
  | "completed"
  | "needsAction"
  | "error";

export interface InfoBoxMessage {
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export function toScriptFileItems(files: File[]): ScriptFileItem[] {
  return files.flatMap((file) => {
    const item = toResolvedFileItem(file, true);
    return item ? [item] : [];
  });
}

export function getScriptExecutionState(
  result: JobResult,
): ScriptExecutionState {
  if (result.success === false || result.kind === "error") {
    return "error";
  }

  if (result.kind === "needsAction") {
    return "needsAction";
  }

  return "completed";
}

export function getScriptInfoMessage(
  executionState: ScriptExecutionState,
  executionResult: JobResult | null,
): InfoBoxMessage {
  switch (executionState) {
    case "error":
      return { text: SCRIPT_MODAL_MESSAGES.ERROR, type: "error" };
    case "needsAction":
      return { text: SCRIPT_MODAL_MESSAGES.NEEDS_ACTION, type: "warning" };
    case "completed":
      return executionResult?.kind === "difference"
        ? { text: SCRIPT_MODAL_MESSAGES.DIFFERENCE, type: "error" }
        : { text: SCRIPT_MODAL_MESSAGES.SUCCESS, type: "success" };
    case "idle":
      return { text: SCRIPT_MODAL_MESSAGES.CONFIRM_IDLE, type: "info" };
  }
}

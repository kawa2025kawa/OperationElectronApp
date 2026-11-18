// src/renderer/features/operation/utils/scriptModalUtils.ts

import { SCRIPT_MODAL_MESSAGES } from "@renderer/features/operation/components/modal/scriptModal/scriptModalConstants";
import {
  toResolvedFileItem,
  type ResolvedFileItem,
} from "@renderer/utils/filePathUtils";
import type { JobResult } from "@shared/types/operation/operationTypes";

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
      return {
        text: SCRIPT_MODAL_MESSAGES.ERROR,
        type: "error",
      };

    case "needsAction":
      return {
        text: SCRIPT_MODAL_MESSAGES.NEEDS_ACTION,
        type: "warning",
      };

    case "completed":
      if (executionResult?.kind === "difference") {
        return {
          text: SCRIPT_MODAL_MESSAGES.DIFFERENCE,
          type: "error",
        };
      }

      return {
        text: SCRIPT_MODAL_MESSAGES.SUCCESS,
        type: "success",
      };

    case "idle":
      return {
        text: SCRIPT_MODAL_MESSAGES.CONFIRM_IDLE,
        type: "info",
      };
  }
}
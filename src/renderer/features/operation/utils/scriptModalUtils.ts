// src/renderer/features/operation/utils/scriptModalUtils.ts

import { SCRIPT_MODAL_MESSAGES } from "@renderer/features/operation/components/modal/scriptModal/scriptModalConstants";
import type { JobResult } from "@shared/types/operation/operationTypes";

export interface ScriptFileItem {
  name: string;
  path: string;
}

export type ScriptExecutionState =
  | "idle"
  | "completed"
  | "needsAction"
  | "error";

export interface InfoBoxMessage {
  text: string;
  type: "info" | "success" | "warning" | "error";
}

function getFilePath(file: File): string {
  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }

  return window.electronAPI.getFilePath(file) || file.name;
}

export function toScriptFileItems(files: File[]): ScriptFileItem[] {
  return files
    .map((file) => ({
      name: file.name,
      path: getFilePath(file),
    }))
    .filter(({ path }) => Boolean(path));
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

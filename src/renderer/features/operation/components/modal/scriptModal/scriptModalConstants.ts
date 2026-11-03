// src/renderer/features/operation/components/modal/scriptModal/scriptModalConstants.ts

export const SCRIPT_MODAL_MESSAGES = {
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

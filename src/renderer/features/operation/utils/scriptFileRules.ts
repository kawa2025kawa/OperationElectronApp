// src/renderer/features/operation/utils/scriptFileRules.ts

import type { InfoBoxMessage, ScriptFileItem } from "./scriptModalUtils";

interface ScriptFileRule {
  /** input[type="file"] の accept 属性 */
  readonly accept?: string;
  /** ドロップエリアに表示する案内文 */
  readonly dropLabel?: string;
  /** 初期表示時の案内メッセージ */
  readonly initialMessage?: string;
  /**
- ドロップ / 選択された直後に呼ばれる即時バリデーション。
- エラーがある場合はエラーメッセージ文字列を返し、問題なければ null を返す。
   */
  readonly validateIncomingFiles: (
    incomingFiles: readonly ScriptFileItem[],
    currentFiles: readonly ScriptFileItem[],
  ) => string | null;
  /**
- 選択済みファイル一覧が実行可能状態かを判定する。
- 不足などがある場合はメッセージ表示と実行ボタン制御に使う。
   */
  readonly getSelectionStatus: (
    selectedFiles: readonly ScriptFileItem[],
  ) => {
    readonly isReadyToExecute: boolean;
    readonly message: InfoBoxMessage | null;
  };
}

interface PairedFileSpec {
  readonly keyword: string;
  readonly extension: string;
}

function hasExtension(fileName: string, extension: string): boolean {
  const normalizedExt = extension.startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;
  return fileName.trim().toLowerCase().endsWith(normalizedExt);
}

function matchesSpec(file: ScriptFileItem, spec: PairedFileSpec): boolean {
  return (
    file.name.includes(spec.keyword) && hasExtension(file.name, spec.extension)
  );
}

function createPairedFileRule(
  first: PairedFileSpec,
  second: PairedFileSpec,
  options: {
    readonly accept: string;
    readonly dropLabel: string;
    readonly initialMessage: string;
    readonly readyMessage: string;
  },
): ScriptFileRule {
  const specs = [first, second] as const;

  return {
    accept: options.accept,
    dropLabel: options.dropLabel,
    initialMessage: options.initialMessage,

    validateIncomingFiles(incomingFiles, currentFiles) {
      const invalidNames = incomingFiles
        .filter((file) => !specs.some((spec) => matchesSpec(file, spec)))
        .map((file) => file.name);

      if (invalidNames.length > 0) {
        const expected = specs
          .map((s) => `「${s.keyword}」(${s.extension})`)
          .join(" または ");
        return `${expected} に一致しないファイルは指定できません: ${invalidNames.join(", ")}`;
      }

      const combined = [...currentFiles, ...incomingFiles];
      for (const spec of specs) {
        const matched = combined.filter((file) => matchesSpec(file, spec));
        if (matched.length > 1) {
          return `「${spec.keyword}」(${spec.extension}) のファイルは1つだけ指定してください`;
        }
      }

      return null;
    },

    getSelectionStatus(selectedFiles) {
      if (selectedFiles.length === 0) {
        return { isReadyToExecute: false, message: null };
      }

      const missing = specs
        .filter((spec) => !selectedFiles.some((file) => matchesSpec(file, spec)))
        .map((spec) => `「${spec.keyword}」(${spec.extension})`);

      if (missing.length === 0 && selectedFiles.length === specs.length) {
        return {
          isReadyToExecute: true,
          message: { text: options.readyMessage, type: "info" },
        };
      }

      return {
        isReadyToExecute: false,
        message: {
          text: `不足しているファイルがあります: ${missing.join("、")}`,
          type: "warning",
        },
      };
    },
  };
}

const E29_FILE_RULE = createPairedFileRule(
  { keyword: "リアル予算", extension: ".xlsx" },
  { keyword: "MEIS0120", extension: ".csv" },
  {
    accept:
      ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
    dropLabel:
      "「リアル予算」(.xlsx) と「MEIS0120」(.csv) をドラッグ＆ドロップ または クリックして選択",
    initialMessage:
      "「リアル予算」(.xlsx) と「MEIS0120」(.csv) の2ファイルをドロップしてください。",
    readyMessage: "2つの対象ファイルが選択されています。実行しますか？",
  },
);

const E30_FILE_RULE = createPairedFileRule(
  { keyword: "売上予算確認", extension: ".csv" },
  { keyword: "MEIS0120", extension: ".csv" },
  {
    accept: ".csv,text/csv",
    dropLabel:
      "「売上予算確認」と「MEIS0120」のCSVファイルをドラッグ＆ドロップ または クリックして選択",
    initialMessage:
      "「売上予算確認」と「MEIS0120」の2つのCSVファイルをドロップしてください。",
    readyMessage: "2つのCSVファイルが選択されています。実行しますか？",
  },
);

const SCRIPT_FILE_RULES: Readonly<Record<string, ScriptFileRule>> = {
  e29: E29_FILE_RULE,
  job_e29: E29_FILE_RULE,
  e30: E30_FILE_RULE,
  job_e30: E30_FILE_RULE,
};

export function getScriptFileRule(
  scriptKey: string | undefined,
): ScriptFileRule | undefined {
  if (!scriptKey) return undefined;
  const normalized = scriptKey.trim().toLowerCase();
  return SCRIPT_FILE_RULES[normalized];
}

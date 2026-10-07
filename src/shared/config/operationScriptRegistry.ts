//src\shared\config\operationScriptRegistry.ts

/**
 * 実行可能なスクリプトキーの定義（すべて小文字に統一）
 * ※ ここに定義されていないキーはレジストリや実行側でTypeScriptエラーになります
 */
export type ScriptKey =
  | "16"
  | "20"
  | "25"
  | "28"
  | "30"
  | "34"
  | "37"
  | "39"
  | "43"
  | "45"
  | "48"
  | "54"
  | "56"
  | "60"
  | "62"
  | "64"
  | "66"
  | "68"
  | "80"
  | "114"
  | "n12"
  | "n20"
  | "n25"
  | "n31"
  | "n33"
  | "e5"
  | "e5_check"
  | "e8"
  | "e9"
  | "e14"
  | "e29"
  | "e30"
  | "e41"
  | "webedi_db"
  | "webedi";

export interface OperationScriptRegistryConfig {
  /** 条件満了 (READY) 時に自動実行するスクリプトキー */
  autoScriptKeys?: ScriptKey[];

  /** 手動ボタンとして画面に表示・実行を許可するスクリプトキー */
  manualScriptKeys?: ScriptKey[];

  /** 手動スクリプト実行時に使用するモーダル種別 */
  modalType?: "pdfUpload";
}

/**
 * 管理Noごとのスクリプト実行設定レジストリ
 */
export const OPERATION_SCRIPT_REGISTRY: Record<
  string,
  OperationScriptRegistryConfig
> = {
  // --- 数字系 ---
  // 自動実行・手動ボタンの両方に設定されているタスク
  "114": { autoScriptKeys: ["114"], manualScriptKeys: ["114"] },
  "16": { autoScriptKeys: ["16"], manualScriptKeys: ["16"] },
  "20": { autoScriptKeys: ["20"], manualScriptKeys: ["20"] },
  "25": { autoScriptKeys: ["25"], manualScriptKeys: ["25"] },
  "28": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] },
  "34": { autoScriptKeys: ["34"], manualScriptKeys: ["34"] },
  "39": { autoScriptKeys: ["39"], manualScriptKeys: ["39"] },
  "43": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] },
  "56": { autoScriptKeys: ["56"], manualScriptKeys: ["56"] },
  "68": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] },
  "80": { autoScriptKeys: ["80"], manualScriptKeys: ["80"] },

  N20: { autoScriptKeys: ["n20"], manualScriptKeys: ["n20"] },
  N25: { autoScriptKeys: ["n25"], manualScriptKeys: ["n25"] },
  N31: { autoScriptKeys: ["n31"], manualScriptKeys: ["n31"] },
  N33: { autoScriptKeys: ["n33"], manualScriptKeys: ["n33"] },

  // --- 手動ボタンのみ設定されているタスク ---
  "30": {
    manualScriptKeys: ["30"],
    modalType: "pdfUpload",
  },
  "37": {
    manualScriptKeys: ["37"],
    modalType: "pdfUpload",
  },
  "45": {
    manualScriptKeys: ["45"],
    modalType: "pdfUpload",
  },
  "48": {
    manualScriptKeys: ["48"],
    modalType: "pdfUpload",
  },
  "54": {
    manualScriptKeys: ["54"],
    modalType: "pdfUpload",
  },
  "60": { manualScriptKeys: ["60"] },
  "62": { manualScriptKeys: ["62"] },
  "64": { manualScriptKeys: ["64"] },
  "66": { manualScriptKeys: ["66"] },

  N12: { manualScriptKeys: ["n12"] },
  N27: { manualScriptKeys: ["webedi_db", "webedi"] },
  N28: { manualScriptKeys: ["webedi"] },

  E5: { manualScriptKeys: ["e5", "e5_check"] },
  E8: { manualScriptKeys: ["e8"] },
  E9: { manualScriptKeys: ["e9"] },
  E14: { manualScriptKeys: ["e14"] },
  E29: { manualScriptKeys: ["e29"] },
  E30: { manualScriptKeys: ["e30"] },
  E41: { manualScriptKeys: ["e41"] },
};

/**
 * 管理Noに紐づく自動実行スクリプトキーを取得する。
 */
export function getAutoScriptKeys(kanriNo: string): ScriptKey[] {
  return OPERATION_SCRIPT_REGISTRY[kanriNo]?.autoScriptKeys ?? [];
}

/**
 * 管理Noに紐づく手動実行スクリプトキーを取得する。
 */
export function getManualScriptKeys(kanriNo: string): ScriptKey[] {
  return OPERATION_SCRIPT_REGISTRY[kanriNo]?.manualScriptKeys ?? [];
}

/**
 * 管理Noに紐づく手動スクリプト実行時のモーダル種別を取得する。
 */
export function getScriptModalType(
  kanriNo: string,
): OperationScriptRegistryConfig["modalType"] | undefined {
  return OPERATION_SCRIPT_REGISTRY[kanriNo]?.modalType;
}

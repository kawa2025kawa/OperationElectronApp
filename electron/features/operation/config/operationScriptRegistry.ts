//electron\features\operation\config\operationScriptRegistry.ts

interface ScriptConfig {
  /** 条件満了 (READY) 時に自動実行するスクリプトキー */
  autoScriptKeys?: string[];
  /** 手動ボタンとして画面に表示・実行を許可するスクリプトキー */
  manualScriptKeys?: string[];
}

/**
 * 管理No (kanriNo) ごとのスクリプト紐づけ・実行定義レジストリ
 */
const OPERATION_SCRIPT_REGISTRY: Record<string, ScriptConfig> = {
  // --- 日次系 ---
  // --- 自動実行 & 手動ボタンの両方に設定されているタスク ---
  "114": { autoScriptKeys: ["114"], manualScriptKeys: ["114"] },
  "16": { autoScriptKeys: ["16"], manualScriptKeys: ["16"] },
  "20": { autoScriptKeys: ["20"], manualScriptKeys: ["20"] },
  "25": { autoScriptKeys: ["25"], manualScriptKeys: ["25"] },
  "28": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] },
  "34": { autoScriptKeys: ["34"], manualScriptKeys: ["34"] },
  "39": { autoScriptKeys: ["39"], manualScriptKeys: ["39"] },
  "43": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] }, // 28と同等のエラーチェック
  "56": { autoScriptKeys: ["56"], manualScriptKeys: ["56"] },
  "68": { autoScriptKeys: ["28"], manualScriptKeys: ["28"] }, // 28と同等のエラーチェック
  "80": { autoScriptKeys: ["80"], manualScriptKeys: ["80"] },
  N20: { autoScriptKeys: ["n20"], manualScriptKeys: ["n20"] },
  N25: { autoScriptKeys: ["n25"], manualScriptKeys: ["n25"] },
  N31: { autoScriptKeys: ["n31"], manualScriptKeys: ["n31"] },
  N33: { autoScriptKeys: ["n33"], manualScriptKeys: ["n33"] },

  // --- 手動ボタンのみ設定されているタスク (manualScripts のみ) ---
  "30": { manualScriptKeys: ["30"] },
  "37": { manualScriptKeys: ["37"] },
  "45": { manualScriptKeys: ["45"] },
  "48": { manualScriptKeys: ["48"] },
  "54": { manualScriptKeys: ["54"] },
  "60": { manualScriptKeys: ["60"] },
  "62": { manualScriptKeys: ["62"] },
  "64": { manualScriptKeys: ["64"] },
  "66": { manualScriptKeys: ["66"] },

  N12: { manualScriptKeys: ["n12"] },
  N27: { manualScriptKeys: ["WEBEDI_DB", "WEBEDI"] },
  N28: { manualScriptKeys: ["WEBEDI"] },
  E5: { manualScriptKeys: ["e5", "e5_check"] },
  E8: { manualScriptKeys: ["e8"] },
  E9: { manualScriptKeys: ["e9"] },
  E14: { manualScriptKeys: ["e14"] },
  E29: { manualScriptKeys: ["e29"] },
  E30: { manualScriptKeys: ["e30"] },
  E41: { manualScriptKeys: ["e41"] },
};

/**
 * kanriNo に紐づく自動実行キーを取得
 */
export function getAutoScriptKeys(kanriNo: string): string[] {
  const cleanNo = kanriNo.trim();
  return OPERATION_SCRIPT_REGISTRY[cleanNo]?.autoScriptKeys ?? [];
}

/**
 * kanriNo に紐づく手動ボタン表示キーを取得
 */
export function getManualScriptKeys(kanriNo: string): string[] {
  const cleanNo = kanriNo.trim();
  return OPERATION_SCRIPT_REGISTRY[cleanNo]?.manualScriptKeys ?? [];
}

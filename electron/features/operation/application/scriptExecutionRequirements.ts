// electron/features/operation/application/scriptExecutionRequirements.ts

export interface ScriptExecutionRequirement {
  requiresFileSelection: boolean;
}

const SCRIPT_EXECUTION_REQUIREMENTS: Readonly<
  Record<string, ScriptExecutionRequirement>
> = {
  E5: { requiresFileSelection: true },
  E14: { requiresFileSelection: true },
  E29: { requiresFileSelection: true },
  E30: { requiresFileSelection: true },
  E41: { requiresFileSelection: true },
};

const DEFAULT_REQUIREMENT: ScriptExecutionRequirement = {
  requiresFileSelection: false,
};

// スクリプトキーに応じたファイル選択必須などの実行要件を取得する。
export function getScriptExecutionRequirement(
  scriptKey: string,
): ScriptExecutionRequirement {
  const normalizedKey = scriptKey.trim().toUpperCase();
  return SCRIPT_EXECUTION_REQUIREMENTS[normalizedKey] ?? DEFAULT_REQUIREMENT;
}

// 手動実行時にファイル選択が必須のスクリプトで有効なファイルパスが存在するか検証する。
export function validateScriptExecutionInput(
  scriptKey: string,
  filePath?: string | string[],
): void {
  const requirement = getScriptExecutionRequirement(scriptKey);

  if (!requirement.requiresFileSelection) {
    return;
  }

  const rawPaths = Array.isArray(filePath)
    ? filePath
    : typeof filePath === "string"
      ? [filePath]
      : [];

  const validPaths = rawPaths.map((p) => p.trim()).filter(Boolean);

  if (validPaths.length === 0) {
    throw new Error(
      `スクリプト ${scriptKey} の実行にはファイルの選択が必要です。`,
    );
  }
}

// electron/features/operation/application/scriptExecutionRequirements.ts

export interface ScriptExecutionRequirement {
  requiresFileSelection: boolean;
}

/**
 * 手動スクリプトの実行要件。
 *
 * ファイル選択要件の唯一の定義元として使用する。
 * キーは大文字・小文字を区別しない。
 */
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

export function getScriptExecutionRequirement(
  scriptKey: string,
): ScriptExecutionRequirement {
  const normalizedKey = scriptKey.trim().toUpperCase();

  return SCRIPT_EXECUTION_REQUIREMENTS[normalizedKey] ?? DEFAULT_REQUIREMENT;
}

/**
 * 手動実行時の入力要件を検証する。
 * 自動実行の実行経路には適用しない。
 */
export function validateScriptExecutionInput(
  scriptKey: string,
  filePath?: string | string[],
): void {
  const requirement = getScriptExecutionRequirement(scriptKey);

  if (!requirement.requiresFileSelection) {
    return;
  }

  const paths = Array.isArray(filePath) ? filePath : filePath ? [filePath] : [];

  const validPaths = paths.filter((path) => path.trim().length > 0);

  if (validPaths.length === 0) {
    throw new Error(
      `スクリプト ${scriptKey} の実行にはファイルの選択が必要です。`,
    );
  }
}

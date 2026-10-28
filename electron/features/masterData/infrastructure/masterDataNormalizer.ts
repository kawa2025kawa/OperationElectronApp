// electron/features/masterData/infrastructure/masterDataNormalizer.ts

// 既存プロパティの文字列値について、前後の空白を除去する。
export function normalizeMasterDataRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => {
    const normalized = { ...row } as Record<string, unknown>;

    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === "string") {
        normalized[key] = value.trim();
      }
    }

    return normalized as T;
  });
}

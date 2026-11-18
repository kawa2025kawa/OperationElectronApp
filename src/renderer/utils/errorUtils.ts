// src/renderer/utils/errorUtils.ts

/** unknown なエラー値から表示用メッセージ文字列を取り出す */
export function toErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const text = String(error ?? "");
  return text || fallback || "予期しないエラーが発生しました";
}
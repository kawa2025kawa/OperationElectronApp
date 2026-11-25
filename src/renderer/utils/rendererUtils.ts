// src/renderer/utils/rendererUtils.ts

import { getFileName } from "@shared/utils/sharedUtils";

export interface ResolvedFileItem {
  name: string;
  path: string;
}

/** unknown なエラー値から表示用メッセージ文字列を取り出す */
export function toErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const text = String(error ?? "");
  return text || fallback || "予期しないエラーが発生しました";
}

function resolveDroppedFilePath(file: File): string {
  const fromBridge = window.electronAPI.getFilePath(file);
  if (fromBridge) {
    return fromBridge;
  }

  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }

  return "";
}

/** File オブジェクトを { name, path } 形式へ変換する（パス未取得時は null） */
export function toResolvedFileItem(
  file: File,
  fallbackToName = false,
): ResolvedFileItem | null {
  const path =
    resolveDroppedFilePath(file) || (fallbackToName ? file.name : "");
  if (!path) {
    return null;
  }

  return {
    name: file.name || getFileName(path) || path,
    path,
  };
}

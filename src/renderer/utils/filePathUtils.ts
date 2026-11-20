// src/renderer/utils/filePathUtils.ts

import { getFileName } from "@shared/utils/fileUtils";

export interface ResolvedFileItem {
  name: string;
  path: string;
}

/** ブラウザの File オブジェクトからローカルファイルパスを取得する */
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

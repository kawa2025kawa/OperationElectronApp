// src/shared/utils/fileUtils.ts

/**
 * ファイルパスまたはURLからファイル名を取得します
 */
export const getFileName = (filePath: string): string => {
  if (!filePath) return "";
  return filePath.split(/[/\\]/).pop() ?? filePath;
};

/**
 * 指定された拡張子を持っているか判定します
 */
export const hasExtension = (filePath: string, ext: string): boolean => {
  const normalizedExt = ext.startsWith(".")
    ? ext.toLowerCase()
    : `.${ext.toLowerCase()}`;
  return filePath.toLowerCase().endsWith(normalizedExt);
};

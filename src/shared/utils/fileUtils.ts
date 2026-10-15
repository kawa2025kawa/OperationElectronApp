// src/shared/utils/fileUtils.ts

/**
 * ファイルパスまたはURLからファイル名を取得します
 */
export const getFileName = (filePath: string): string => {
  if (!filePath) return "";
  return filePath.split(/[/\\]/).pop() ?? filePath;
};

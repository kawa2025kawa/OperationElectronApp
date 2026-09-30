// src/renderer/features/other/services/giftMdService.ts

import { systemCommands } from "@renderer/services/commands";

async function process(filePath: string): Promise<string> {
  const normalizedPath = filePath.trim();

  if (!normalizedPath) {
    throw new Error("処理対象のファイルが指定されていません。");
  }

  return systemCommands.processGiftMd(normalizedPath);
}

export const giftMdService = {
  process,
};

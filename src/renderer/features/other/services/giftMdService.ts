// src/renderer/features/other/services/giftMdService.ts

import { trpc } from "@renderer/lib/trpc";

async function process(filePath: string): Promise<string> {
  const normalizedPath = filePath.trim();

  if (!normalizedPath) {
    throw new Error("処理対象のファイルが指定されていません。");
  }

  return trpc.other.processGiftMd.mutate(normalizedPath);
}

export const giftMdService = {
  process,
};

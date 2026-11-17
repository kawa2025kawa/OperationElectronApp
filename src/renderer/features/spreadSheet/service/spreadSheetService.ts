// src/renderer/features/spreadSheet/service/spreadSheetService.ts

import { toast } from "sonner";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";

/** 有効なパス・URL 文字列かを正規化して返す */
export function normalizeExternalTarget(value: unknown): string {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  return trimmed && trimmed !== EMPTY_VALUE_FALLBACK ? trimmed : "";
}

/** SpreadSheet 機能に関連する外部連携サービス */
export const spreadSheetService = {
  /** 外部 URL またはローカルファイルを既定アプリケーションで開く */
  openExternal: async (
    target: unknown,
    errorPrefix = "リンクを開けませんでした",
  ): Promise<void> => {
    const normalized = normalizeExternalTarget(target);
    if (!normalized) return;

    try {
      await systemIpcService.openExternal(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`${errorPrefix}: ${message}`);
    }
  },
};

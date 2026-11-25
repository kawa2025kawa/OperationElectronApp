// src/renderer/services/spreadSheetService.ts

import { toast } from "sonner";
import {
  IPC_CHANNELS,
  type StaffScheduleSheetId,
} from "@shared/types/electron/ipcTypes";
import type { ShopResourceKey } from "@shared/types/spreadsheet/spreadsheetTypes";
import { systemIpcService } from "@renderer/services/ipcServices";
import { EMPTY_VALUE_FALLBACK } from "@shared/utils/sharedUtils";
import { toErrorMessage } from "@renderer/utils/rendererUtils";

/** 有効なパス・URL 文字列かを正規化して返す */
function normalizeExternalTarget(value: unknown): string {
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

    await systemIpcService.openExternalWithToast(normalized, errorPrefix);
  },

  /** Main 側でスタッフのスケジュールリンクを開く（生URLをRendererに保持しない） */
  openStaffSchedule: async (
    sheetId: StaffScheduleSheetId,
    staffId: string,
  ): Promise<void> => {
    if (!staffId) return;

    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.SPREADSHEET.OPEN_STAFF_SCHEDULE,
        { sheetId, staffId },
      );
    } catch (error) {
      toast.error(
        `スケジュールリンクを開けませんでした: ${toErrorMessage(error)}`,
      );
    }
  },

  /** Main 側で店舗の完成図書・画像リソースを開く（生パスをRendererに保持しない） */
  openShopResource: async (
    shopCode: string,
    resourceKey: ShopResourceKey,
  ): Promise<void> => {
    if (!shopCode) return;

    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.SPREADSHEET.OPEN_SHOP_RESOURCE,
        { shopCode, resourceKey },
      );
    } catch (error) {
      toast.error(`ファイルを開けませんでした: ${toErrorMessage(error)}`);
    }
  },
};

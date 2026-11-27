// src/renderer/features/spreadSheet/service/spreadSheetService.ts

import { toast } from "sonner";
import type { StaffScheduleSheetId } from "@shared/types/electron/ipcTypes";
import type { ShopResourceKey } from "@shared/types/spreadsheet/spreadsheetTypes";
import { spreadsheetIpcService } from "@renderer/services/ipcServices";
import { toErrorMessage } from "@renderer/utils/rendererUtils";

/** SpreadSheet 機能に関連する外部連携サービス */
export const spreadSheetService = {
  /** Main 側でスタッフのスケジュールリンクを開く（生URLをRendererに保持しない） */
  openStaffSchedule: async (
    sheetId: StaffScheduleSheetId,
    staffId: string,
  ): Promise<void> => {
    if (!staffId) return;

    try {
      await spreadsheetIpcService.openStaffSchedule(sheetId, staffId);
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
      await spreadsheetIpcService.openShopResource(shopCode, resourceKey);
    } catch (error) {
      toast.error(`ファイルを開けませんでした: ${toErrorMessage(error)}`);
    }
  },
};

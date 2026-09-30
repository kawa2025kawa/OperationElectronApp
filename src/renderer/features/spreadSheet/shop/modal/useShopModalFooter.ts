//src/renderer/features/spreadSheet/shop/useShopModalFooter.ts

import { useCallback, useEffect } from "react";
import { selectShopFilePaths } from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import { systemCommands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Shop } from "@shared/types/spreadsheet/shop";

export function useShopModalFooter(data: Shop) {
  const fetchSheetData = useAppStore((state) => state.fetchSheetData);

  // Store & Selector にロジックを委譲（useMemo も find も一切不要）
  const { excelPath, pdfPath } = useAppStore(
    useCallback(
      (state) => selectShopFilePaths(data.shopCode)(state),
      [data.shopCode],
    ),
  );

  useEffect(() => {
    void fetchSheetData(SHEETS.STORE.sheetName);
  }, [fetchSheetData]);

  const handleOpen = useCallback(async (path: string) => {
    const normalizedPath = path.trim();

    if (!normalizedPath) return;

    try {
      await systemCommands.openExternal(normalizedPath);
    } catch (error) {
      console.error(
        "[useShopModalFooter] Failed to open external path:",
        normalizedPath,
        error,
      );
    }
  }, []);

  return {
    excelPath,
    pdfPath,
    handleOpen,
  };
}

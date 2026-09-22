import { useCallback, useEffect, useMemo } from "react";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import type { Shop } from "@shared/types/spreadsheet/shop";

const SHOP_SHEET_ID = "StoreMasterData" as const;

export function toCleanCode(val: unknown): string {
  if (val == null) return "";

  const value = String(val).trim();

  return /^\d+$/.test(value)
    ? String(parseInt(value, 10))
    : value.toLowerCase();
}

export function useShopModalFooter(data: Shop) {
  const fetchSheetData = useAppStore((state) => state.fetchSheetData);

  const shopSheetResponse = useAppStore(
    (state) => state.sheetData[SHOP_SHEET_ID],
  );

  useEffect(() => {
    if (!shopSheetResponse) {
      void fetchSheetData(SHOP_SHEET_ID);
    }
  }, [shopSheetResponse, fetchSheetData]);

  const paths = useMemo(() => {
    const rows = shopSheetResponse?.data;

    if (!Array.isArray(rows) || rows.length === 0 || !data.shopCode) {
      return {
        excelPath: "",
        pdfPath: "",
      };
    }

    const targetCode = toCleanCode(data.shopCode);

    const matched = (rows as Shop[]).find(
      (row) => toCleanCode(row.shopCode) === targetCode,
    );

    if (!matched) {
      return {
        excelPath: "",
        pdfPath: "",
      };
    }

    return {
      excelPath:
        matched.excelFilePath && matched.excelFilePath !== "-"
          ? matched.excelFilePath
          : "",
      pdfPath:
        matched.pdfFilePath && matched.pdfFilePath !== "-"
          ? matched.pdfFilePath
          : "",
    };
  }, [shopSheetResponse, data.shopCode]);

  const handleOpen = useCallback(async (path: string) => {
    if (!path) return;

    try {
      await commands.openExternal(path);
    } catch (error) {
      console.error("[ShopModalFooter] Failed to open:", path, error);
    }
  }, []);

  return {
    excelPath: paths.excelPath,
    pdfPath: paths.pdfPath,
    handleOpen,
  };
}

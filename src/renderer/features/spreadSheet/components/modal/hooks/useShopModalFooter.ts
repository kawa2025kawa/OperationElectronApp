import { useCallback, useEffect, useMemo } from "react";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheet";

export function toCleanCode(val: unknown): string {
  if (val == null) return "";
  const s = String(val).trim();
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

export function useShopModalFooter(data: Shop) {
  const fetchSheetData = useAppStore((state) => state.fetchSheetData);
  const kanseiSheetResponse = useAppStore(
    (state) => state.sheetData[SHEET_IDS.SHOP],
  );

  useEffect(() => {
    if (!kanseiSheetResponse) {
      void fetchSheetData(SHEET_IDS.SHOP);
    }
  }, [kanseiSheetResponse, fetchSheetData]);

  const paths = useMemo(() => {
    const rawRows = kanseiSheetResponse?.data;
    if (!Array.isArray(rawRows) || rawRows.length === 0 || !data.code) {
      return { excelPath: "", pdfPath: "" };
    }

    const cleanTarget = toCleanCode(data.code);

    const matched = (rawRows as Record<string, unknown>[]).find((row) => {
      const code = row.shopCode ?? row.code ?? row.shop_code;
      if (code != null && toCleanCode(code) === cleanTarget) {
        return true;
      }
      return Object.values(row).some((val) => toCleanCode(val) === cleanTarget);
    });

    if (!matched) return { excelPath: "", pdfPath: "" };

    let excelPath = String(
      matched.excelFilePath ?? matched.excelPath ?? matched.excel ?? "",
    ).trim();
    let pdfPath = String(
      matched.pdfFilePath ??
        matched.FilePath ??
        matched.pdfPath ??
        matched.pdf ??
        "",
    ).trim();

    if (excelPath === "-") excelPath = "";
    if (pdfPath === "-") pdfPath = "";

    if (!excelPath || !pdfPath) {
      for (const [key, val] of Object.entries(matched)) {
        if (typeof val !== "string" || !val.trim() || val.trim() === "-")
          continue;
        const k = key.toLowerCase();
        const v = val.trim();

        if (
          !excelPath &&
          (k === "excelfilepath" ||
            (k.includes("excel") &&
              !k.includes("name") &&
              !k.includes("modified")) ||
            v.toLowerCase().endsWith(".xlsx"))
        ) {
          excelPath = v;
        }

        if (
          !pdfPath &&
          (k === "pdffilepath" ||
            k === "filepath" ||
            (k.includes("pdf") &&
              !k.includes("name") &&
              !k.includes("modified")) ||
            v.toLowerCase().endsWith(".pdf"))
        ) {
          pdfPath = v;
        }
      }
    }

    return { excelPath, pdfPath };
  }, [kanseiSheetResponse, data.code]);

  const handleOpen = useCallback(async (path: string) => {
    if (!path) return;
    try {
      await commands.openExternal(path);
    } catch (error) {
      console.error(
        "[ShopModalFooter] Failed to open external link:",
        path,
        error,
      );
    }
  }, []);

  return {
    excelPath: paths.excelPath,
    pdfPath: paths.pdfPath,
    handleOpen,
  };
}

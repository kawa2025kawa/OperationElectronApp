// src/renderer/features/spreadSheet/shop/modal/useShopModalContent.ts

import { useMemo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { ModalAction } from "@shared/types/ui/modal";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
  SHOP_MODAL_CONSTANTS,
  EMPTY_VALUE_FALLBACK,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: Shop;
}

function getValidFilePath(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.trim();
  return path && path !== EMPTY_VALUE_FALLBACK ? path : "";
}

export const useShopModalContent = ({ data }: UseShopModalContentParams) => {
  const excelPath = getValidFilePath(data.excelFilePath);
  const pdfPath = getValidFilePath(data.pdfFilePath);

  const { selectedIndex, setSelectedIndex, groups, displayItems } =
    useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title ===
    SHOP_MODAL_CONSTANTS.TAB_TITLES.TIME_RECORDER;

  const handleOpenPath = useCallback(async (path: string | undefined) => {
    if (!path || path === EMPTY_VALUE_FALLBACK) return;
    const normalized = path.trim();
    if (!normalized) return;

    try {
      await systemIpcService.openExternal(normalized);
    } catch (error) {
      console.error(
        "[useShopModalContent] Failed to open external path:",
        normalized,
        error,
      );
    }
  }, []);

  const timeRecorderActions = useMemo<ModalAction[]>(() => {
    if (!isTimeRecorderTab) return [];

    const imageActions: ModalAction[] = TIME_RECORDER_IMAGE_ITEMS.map(
      ({ key, label }) => {
        const rawValue = data[key];
        const hasUrl = Boolean(rawValue && rawValue !== EMPTY_VALUE_FALLBACK);

        return {
          id: `image-${key}`,
          label,
          onClick: () => {
            void handleOpenPath(rawValue);
          },
          disabled: !hasUrl,
          variant: "default",
        };
      },
    );

    const fileActions: ModalAction[] = [];

    if (excelPath) {
      fileActions.push({
        id: "excel",
        label: SHOP_MODAL_CONSTANTS.FILES.EXCEL_LABEL,
        onClick: () => {
          void handleOpenPath(excelPath);
        },
        variant: "default",
      });
    }

    if (pdfPath) {
      fileActions.push({
        id: "pdf",
        label: SHOP_MODAL_CONSTANTS.FILES.PDF_LABEL,
        onClick: () => {
          void handleOpenPath(pdfPath);
        },
        variant: "default",
      });
    }

    return [...imageActions, ...fileActions];
  }, [isTimeRecorderTab, data, excelPath, pdfPath, handleOpenPath]);

  return {
    selectedIndex,
    setSelectedIndex,
    groups,
    displayItems,
    isTimeRecorderTab,
    timeRecorderActions,
  };
};

// src/renderer/features/spreadSheet/shop/modal/useShopModalContent.ts

import { useMemo, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { ModalAction } from "@shared/types/ui/modal";
import { useAppStore } from "@renderer/store";
import { selectShopFilePaths } from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import { trpc } from "@renderer/lib/trpc";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: Shop;
}

export const useShopModalContent = ({ data }: UseShopModalContentParams) => {
  const { excelPath, pdfPath } = useAppStore(
    useShallow((state) => selectShopFilePaths(data.shopCode)(state)),
  );

  const { selectedIndex, setSelectedIndex, groups, displayItems } =
    useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title === "タイムレコーダー";

  const handleOpen = useCallback(async (path: string) => {
    const normalizedPath = path.trim();

    if (!normalizedPath) return;

    try {
      await trpc.system.openExternal.mutate({ urlOrPath: normalizedPath });
    } catch (error) {
      console.error(
        "[useShopModalContent] Failed to open external path:",
        normalizedPath,
        error,
      );
    }
  }, []);

  const handleOpenImage = useCallback((value: string | undefined) => {
    if (value && value !== "-") {
      void trpc.system.openExternal.mutate({ urlOrPath: value });
    }
  }, []);

  const leftActions = useMemo<ModalAction[]>(() => {
    if (!isTimeRecorderTab) return [];

    const imageActions: ModalAction[] = TIME_RECORDER_IMAGE_ITEMS.map(
      ({ key, label }) => {
        const rawValue = data[key];
        const hasUrl = Boolean(rawValue && rawValue !== "-");

        return {
          id: `image-${key}`,
          label,
          onClick: () => handleOpenImage(rawValue),
          disabled: !hasUrl,
          variant: "default",
        };
      },
    );

    const fileActions: ModalAction[] = [];

    if (excelPath) {
      fileActions.push({
        id: "excel",
        label: "店舗情報.xlsx",
        onClick: () => void handleOpen(excelPath),
        variant: "default",
      });
    }

    if (pdfPath) {
      fileActions.push({
        id: "pdf",
        label: "店舗情報.pdf",
        onClick: () => void handleOpen(pdfPath),
        variant: "default",
      });
    }

    return [...imageActions, ...fileActions];
  }, [
    isTimeRecorderTab,
    data,
    excelPath,
    pdfPath,
    handleOpen,
    handleOpenImage,
  ]);

  return {
    selectedIndex,
    setSelectedIndex,
    groups,
    displayItems,
    isTimeRecorderTab,
    leftActions,
  };
};

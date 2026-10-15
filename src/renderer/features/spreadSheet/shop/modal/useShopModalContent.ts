// src/renderer/features/spreadSheet/shop/modal/useShopModalContent.ts

import { useMemo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { ModalAction } from "@shared/types/ui/modal";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: Shop;
}

function getValidFilePath(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.trim();
  return path && path !== "-" ? path : "";
}

export const useShopModalContent = ({ data }: UseShopModalContentParams) => {
  // 渡された data から直接取得し、Zustandの全件再検索と不要サブスクリプションを排除
  const excelPath = getValidFilePath(data.excelFilePath);
  const pdfPath = getValidFilePath(data.pdfFilePath);

  const { selectedIndex, setSelectedIndex, groups, displayItems } =
    useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title === "タイムレコーダー";

  const handleOpen = useCallback(async (path: string) => {
    const normalizedPath = path.trim();
    if (!normalizedPath) return;

    try {
      await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, {
        urlOrPath: normalizedPath,
      });
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
      void window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, {
        urlOrPath: value,
      });
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

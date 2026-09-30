import { useMemo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { ModalAction } from "@shared/types/ui/modal";
import { systemCommands } from "@renderer/services/commands";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: Shop;
  excelPath?: string;
  pdfPath?: string;
  handleOpen: (path: string) => void;
}

export const useShopModalContent = ({
  data,
  excelPath,
  pdfPath,
  handleOpen,
}: UseShopModalContentParams) => {
  const { selectedIndex, setSelectedIndex, groups, displayItems } =
    useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title === "タイムレコーダー";

  const handleOpenImage = useCallback((value: string | undefined) => {
    if (value && value !== "-") {
      void systemCommands.openExternal(value);
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

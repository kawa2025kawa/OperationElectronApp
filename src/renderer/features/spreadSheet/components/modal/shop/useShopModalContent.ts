// src/renderer/features/spreadSheet/components/modal/shop/useShopModalContent.ts

import { useMemo, useState, useCallback } from "react";
import type { Shop, ShopKey } from "@shared/types/spreadsheet/shop";
import type { ModalAction } from "@shared/types/ui/modal";
import { commands } from "@renderer/services/commands";
import { SHOP_MODAL_GROUPS, TIME_RECORDER_IMAGE_ITEMS } from "./constants";

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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayItems = useMemo(() => {
    const currentGroup = SHOP_MODAL_GROUPS[selectedIndex];
    if (!currentGroup) return [];

    return currentGroup.items.map((item) => {
      const rawValue = data[item.key as ShopKey];
      return {
        label: item.label,
        value: rawValue && rawValue !== "" ? rawValue : "-",
      };
    });
  }, [selectedIndex, data]);

  // 🎯 選択中のタブが「タイムレコーダ」か判定
  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title === "タイムレコーダ";

  const handleOpenImage = useCallback((value: string | undefined) => {
    if (value && value !== "-") {
      void commands.openExternal(value);
    }
  }, []);

  // 🎯 selectedIndex (isTimeRecorderTab) を依存配列に含め、タブ切り替え時に即座に再評価させる
  const leftActions = useMemo<ModalAction[]>(() => {
    // タイムレコーダタブ以外では完全に空の配列を返す
    if (!isTimeRecorderTab) return [];

    // ① 画像ボタン群 (TR1～TR4)
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

    // ② ファイル閲覧ボタン群 (Excel / PDF)
    const fileActions: ModalAction[] = [];
    if (excelPath) {
      fileActions.push({
        id: "excel",
        label: "完成図書.xlsx",
        onClick: () => void handleOpen(excelPath),
        variant: "default",
      });
    }
    if (pdfPath) {
      fileActions.push({
        id: "pdf",
        label: "完成図書.pdf",
        onClick: () => void handleOpen(pdfPath),
        variant: "default",
      });
    }

    return [...imageActions, ...fileActions];
  }, [
    isTimeRecorderTab,
    selectedIndex,
    data,
    excelPath,
    pdfPath,
    handleOpen,
    handleOpenImage,
  ]);

  return {
    selectedIndex,
    setSelectedIndex,
    groups: SHOP_MODAL_GROUPS,
    displayItems,
    isTimeRecorderTab,
    leftActions,
  };
};

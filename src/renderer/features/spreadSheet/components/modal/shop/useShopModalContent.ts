import { useMemo, useState, useCallback } from "react";
import type { Shop, ShopKey } from "@shared/types/spreadsheet/shop";
import { commands } from "@renderer/services/commands";
import { SHOP_MODAL_GROUPS } from "./constants";

export const useShopModalContent = (data: Shop) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 現在選択されているタブの表示用アイテムリスト
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

  const currentTabTitle = SHOP_MODAL_GROUPS[selectedIndex]?.title ?? "";
  const isTimeRecorderTab = currentTabTitle === "タイムレコーダ";

  // 画像URL判定
  const getImageLinkUrl = useCallback((value: string | undefined) => {
    if (!value || value === "-") return undefined;
    return value;
  }, []);

  // 画像リンクの外部ブラウザ起動
  const handleOpenImage = useCallback(
    (value: string | undefined) => {
      const url = getImageLinkUrl(value);
      if (url) {
        void commands.openExternal(url);
      }
    },
    [getImageLinkUrl],
  );

  return {
    selectedIndex,
    setSelectedIndex,
    groups: SHOP_MODAL_GROUPS,
    displayItems,
    isTimeRecorderTab,
    commentValue: data.comment || "-",
    handleOpenImage,
    getImageLinkUrl,
  };
};

// src/renderer/features/spreadSheet/shop/modal/useShopModalContent.ts

import { useMemo, useCallback } from "react";
import { EMPTY_VALUE_FALLBACK } from "@shared/utils/sharedUtils";
import type {
  PublicShop,
  ShopResourceKey,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { ModalAction } from "@shared/types/ui/modal";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import { spreadSheetService } from "../../service/spreadSheetService";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
  SHOP_MODAL_CONSTANTS,
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: PublicShop;
}

export const useShopModalContent = ({ data }: UseShopModalContentParams) => {
  const { selectedIndex, setSelectedIndex, groups, displayItems } =
    useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

  const tabItems = useMemo(
    () =>
      groups.map((group, idx) => ({
        id: idx,
        label: group.title,
      })),
    [groups],
  );

  const terminalRows = useMemo(
    () =>
      TERMINAL_TYPES.map((type) => ({
        type,
        badge: type.toUpperCase(),
        cells: TERMINAL_FIELDS.map(({ suffix }) => {
          const fieldKey = `${type}${suffix}` as Exclude<
            keyof PublicShop,
            "availableResources"
          >;
          return {
            key: suffix,
            value: data[fieldKey] || EMPTY_VALUE_FALLBACK,
          };
        }),
      })),
    [data],
  );

  const isTimeRecorderTab =
    SHOP_MODAL_GROUPS[selectedIndex]?.title ===
    SHOP_MODAL_CONSTANTS.TAB_TITLES.TIME_RECORDER;

  const handleOpenResource = useCallback(
    (resourceKey: ShopResourceKey) => {
      if (!data.shopCode) return;
      void spreadSheetService.openShopResource(data.shopCode, resourceKey);
    },
    [data.shopCode],
  );

  const timeRecorderActions = useMemo<ModalAction[]>(() => {
    if (!isTimeRecorderTab) return [];

    const resources = data.availableResources ?? {};

    const imageActions: ModalAction[] = TIME_RECORDER_IMAGE_ITEMS.map(
      ({ key, label }) => ({
        id: `image-${key}`,
        label,
        onClick: () => handleOpenResource(key),
        disabled: !resources[key],
        variant: "default",
      }),
    );

    const fileActions: ModalAction[] = [];

    if (resources.excelFilePath) {
      fileActions.push({
        id: "excel",
        label: SHOP_MODAL_CONSTANTS.FILES.EXCEL_LABEL,
        onClick: () => handleOpenResource("excelFilePath"),
        variant: "default",
      });
    }

    if (resources.pdfFilePath) {
      fileActions.push({
        id: "pdf",
        label: SHOP_MODAL_CONSTANTS.FILES.PDF_LABEL,
        onClick: () => handleOpenResource("pdfFilePath"),
        variant: "default",
      });
    }

    return [...imageActions, ...fileActions];
  }, [isTimeRecorderTab, data.availableResources, handleOpenResource]);

  return {
    selectedIndex,
    setSelectedIndex,
    tabItems,
    displayItems,
    terminalRows,
    trHeaderBadge: SHOP_MODAL_CONSTANTS.TR_HEADER_BADGE,
    terminalFields: TERMINAL_FIELDS,
    isTimeRecorderTab,
    timeRecorderActions,
  };
};

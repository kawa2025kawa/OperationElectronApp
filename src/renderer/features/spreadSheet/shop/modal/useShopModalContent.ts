// src/renderer/features/spreadSheet/shop/modal/useShopModalContent.ts

import { useMemo, useCallback } from "react";
import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { ModalAction } from "@shared/types/ui/modal";
import { useSpreadSheetTabData } from "../../hooks/useSpreadSheetTabData";
import {
  normalizeExternalTarget,
  spreadSheetService,
} from "../../service/spreadSheetService";
import {
  SHOP_MODAL_GROUPS,
  TIME_RECORDER_IMAGE_ITEMS,
  SHOP_MODAL_CONSTANTS,
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
} from "./shopModalConfig";

interface UseShopModalContentParams {
  data: Shop;
}

export const useShopModalContent = ({ data }: UseShopModalContentParams) => {
  const excelPath = normalizeExternalTarget(data.excelFilePath);
  const pdfPath = normalizeExternalTarget(data.pdfFilePath);

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
          const fieldKey = `${type}${suffix}` as keyof Shop;
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

  const handleOpenPath = useCallback((path: unknown) => {
    void spreadSheetService.openExternal(path, "ファイルを開けませんでした");
  }, []);

  const timeRecorderActions = useMemo<ModalAction[]>(() => {
    if (!isTimeRecorderTab) return [];

    const imageActions: ModalAction[] = TIME_RECORDER_IMAGE_ITEMS.map(
      ({ key, label }) => {
        const rawValue = data[key];
        const hasUrl = Boolean(normalizeExternalTarget(rawValue));

        return {
          id: `image-${key}`,
          label,
          onClick: () => handleOpenPath(rawValue),
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
        onClick: () => handleOpenPath(excelPath),
        variant: "default",
      });
    }

    if (pdfPath) {
      fileActions.push({
        id: "pdf",
        label: SHOP_MODAL_CONSTANTS.FILES.PDF_LABEL,
        onClick: () => handleOpenPath(pdfPath),
        variant: "default",
      });
    }

    return [...imageActions, ...fileActions];
  }, [isTimeRecorderTab, data, excelPath, pdfPath, handleOpenPath]);

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
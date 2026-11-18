// src/renderer/components/ui/button/tantouButton/useTantouButton.ts

import { createElement, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import {
  SHEETS,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { TantouDetailContent } from "@renderer/features/spreadSheet/tantou/modal/TantouDetailContent";

const EMPTY_TANTOU_MASTERS: readonly Tantou[] = Object.freeze([]);

export function useTantouButton() {
  const { tantouData, openGlobalModal } = useAppStore(
    useShallow((state) => ({
      tantouData:
        state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName]?.data ??
        EMPTY_TANTOU_MASTERS,
      openGlobalModal: state.openGlobalModal,
    })),
  );

  const handleClick = useCallback(() => {
    const firstRow = tantouData[0];

    if (!firstRow) {
      return;
    }

    openGlobalModal(createElement(TantouDetailContent, { data: firstRow }), {
      title: "担当表",
    });
  }, [tantouData, openGlobalModal]);

  return {
    isDisabled: tantouData.length === 0,
    handleClick,
  };
}
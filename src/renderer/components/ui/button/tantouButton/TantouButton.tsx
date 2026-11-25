// src/renderer/components/ui/button/tantouButton/TantouButton.tsx

import { createElement, memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { TantouDetailContent } from "@renderer/features/spreadSheet/tantou/modal/TantouDetailContent";
import { useAppStore } from "@renderer/store";
import {
  SHEETS,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import * as styles from "./tantouButton.css";

const EMPTY_TANTOU_MASTERS: readonly Tantou[] = Object.freeze([]);

export const TantouButton = memo(() => {
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
    if (!firstRow) return;

    openGlobalModal(createElement(TantouDetailContent, { data: firstRow }), {
      title: "担当表",
    });
  }, [tantouData, openGlobalModal]);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={tantouData.length === 0}
      title="当日の担当者一覧を表示"
    >
      担当表
    </button>
  );
});

TantouButton.displayName = "TantouButton";

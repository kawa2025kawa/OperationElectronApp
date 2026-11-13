// src/renderer/components/ui/button/tantouButton/TantouButton.tsx

import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import {
  SHEETS,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { TantouDetailContent } from "@renderer/features/spreadSheet/tantou/modal/TantouDetailContent";
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

  const handleClick = () => {
    const firstRow = tantouData[0];

    if (!firstRow) {
      return;
    }

    openGlobalModal(<TantouDetailContent data={firstRow} />, {
      title: "担当表",
    });
  };

  const isDisabled = tantouData.length === 0;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={isDisabled}
      title="当日の担当者一覧を表示"
    >
      担当表
    </button>
  );
});

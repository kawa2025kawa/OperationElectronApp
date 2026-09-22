// src/renderer/components/ui/button/tantouButton/TantouButton.tsx

import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { TantouModalContent } from "@renderer/features/spreadSheet/components/modal/tantou/TantouModalContent";
import * as styles from "./tantouButton.css";

const TANTOU_SHEET_ID = "KokyuhyoTantouMasterData" as const;

export const TantouButton: React.FC = React.memo(() => {
  const { tantouData, openGlobalModal } = useAppStore(
    useShallow((state) => ({
      tantouData: state.sheetData[TANTOU_SHEET_ID]?.data as
        | Tantou[]
        | undefined,
      openGlobalModal: state.openGlobalModal,
    })),
  );

  const handleClick = useCallback(() => {
    const firstRow = tantouData?.[0];
    if (!firstRow) return;

    // 🎯【修正】コンポーネント関数としてラッパーを作成して渡す
    const Content = () => <TantouModalContent data={firstRow} />;
    Object.assign(Content, TantouModalContent);

    openGlobalModal(Content, {
      title: "担当表",
      width: "70vw",
      height: "70vh",
    });
  }, [tantouData, openGlobalModal]);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={!tantouData || tantouData.length === 0}
      title="当日の担当者一覧を表示"
    >
      担当表
    </button>
  );
});

TantouButton.displayName = "TantouButton";

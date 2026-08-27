// src/renderer/components/layout/navbar/components/tantouButton/TantouButton.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@shared/store";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheetTypes";
import { APP_REGISTRY, getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { SpreadSheetModal } from "@renderer/features/spreadSheet/components/modal/SpreadSheetModal";
import * as styles from "./tantouButton.css";

export const TantouButton: React.FC = () => {
  const fetchSheetData = useAppStore((s) => s.fetchSheetData);
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  const handleClick = useCallback(async () => {
    const tantouConfig = APP_REGISTRY[APP_VIEW_IDS.TANTOU]?.modalConfig;

    // 1. ストア（Zustand）からキャッシュデータを即座に取得
    let rawData = useAppStore.getState().sheetData[SHEET_IDS.TANTOU]?.data;

    // 2. キャッシュが存在しない場合（未ログイン起動時等）のみ API 完了を待つ
    if (!rawData) {
      await fetchSheetData(SHEET_IDS.TANTOU);
      rawData = useAppStore.getState().sheetData[SHEET_IDS.TANTOU]?.data;
    } else {
      // キャッシュで即モーダルを開きつつ、バックグラウンドで最新化したい場合は非同期で投げる
      void fetchSheetData(SHEET_IDS.TANTOU);
    }

    const tantouData = (
      Array.isArray(rawData) ? rawData[0] : rawData
    ) as Tantou | null;

    if (tantouData) {
      openGlobalModal(
        <SpreadSheetModal
          sheetId={SHEET_IDS.TANTOU}
          data={tantouData}
          title={getAppViewConfig(APP_VIEW_IDS.TANTOU).title}
          onClose={closeGlobalModal}
        />,
        {
          width: tantouConfig?.modalSize?.width ?? "1000px",
          height: tantouConfig?.modalSize?.height ?? "600px",
        },
      );
    }
  }, [fetchSheetData, openGlobalModal, closeGlobalModal]);

  return (
    <button className={styles.button} onClick={handleClick} type="button">
      本日の担当者
    </button>
  );
};

TantouButton.displayName = "TantouButton";

// src/renderer/components/layout/navbar/components/tantouButton/TantouButton.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@shared/store";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheetTypes";
import { APP_REGISTRY, getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { TantouModalContent } from "@renderer/features/spreadSheet/components/modal/contents/tantou/TantouModalContent";
import * as styles from "./tantouButton.css";

export const TantouButton: React.FC = () => {
  const fetchSheetData = useAppStore((s) => s.fetchSheetData);
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  const handleClick = useCallback(async () => {
    // 担当スプレッドシートデータの取得
    await fetchSheetData(SHEET_IDS.TANTOU);

    // 最新データの取得
    const rawData = useAppStore.getState().sheetData[SHEET_IDS.TANTOU]?.data;
    const tantouData = (
      Array.isArray(rawData) ? rawData[0] : rawData
    ) as Tantou | null;
    const tantouConfig = APP_REGISTRY[APP_VIEW_IDS.TANTOU]?.modalConfig;

    if (tantouData) {
      openGlobalModal(
        <TantouModalContent
          data={tantouData}
          title={getAppViewConfig(APP_VIEW_IDS.TANTOU).title}
          onClose={closeGlobalModal}
        />,
        {
          width: tantouConfig?.modalSize?.width ?? "800px",
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

export default TantouButton;

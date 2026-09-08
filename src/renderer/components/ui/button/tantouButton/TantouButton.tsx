import React, { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import type { Tantou } from "@shared/types/spreadsheet";
import { APP_REGISTRY, getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { SpreadSheetModal } from "@renderer/features/spreadSheet/components/modal/SpreadSheetModal";
import * as styles from "./tantouButton.css";

const TANTOU_SHEET_ID = "KokyuhyoTantouMasterData" as const;

export const TantouButton: React.FC = () => {
  const fetchSheetData = useAppStore((s) => s.fetchSheetData);
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  const handleClick = useCallback(async () => {
    const tantouConfig = APP_REGISTRY[APP_VIEW_IDS.TANTOU]?.modalConfig;

    let rawData = useAppStore.getState().sheetData[TANTOU_SHEET_ID]?.data;

    if (!rawData) {
      await fetchSheetData(TANTOU_SHEET_ID);
      rawData = useAppStore.getState().sheetData[TANTOU_SHEET_ID]?.data;
    } else {
      void fetchSheetData(TANTOU_SHEET_ID);
    }

    const tantouData = (
      Array.isArray(rawData) ? rawData[0] : rawData
    ) as Tantou | null;

    if (!tantouData) {
      return;
    }

    openGlobalModal(
      <SpreadSheetModal
        sheetId={TANTOU_SHEET_ID}
        data={tantouData}
        title={getAppViewConfig(APP_VIEW_IDS.TANTOU).title}
        onClose={closeGlobalModal}
      />,
      {
        width: tantouConfig?.modalSize?.width ?? "1000px",
        height: tantouConfig?.modalSize?.height ?? "600px",
      },
    );
  }, [fetchSheetData, openGlobalModal, closeGlobalModal]);

  return (
    <button className={styles.button} onClick={handleClick} type="button">
      本日の担当者
    </button>
  );
};

TantouButton.displayName = "TantouButton";

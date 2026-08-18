import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { useAppStore } from "@shared/store";

import { JugyoinKokyuhyoModalContent } from "./components/modal/contents/common/JugyoinKokyuhyoModalContent";
import { ShopModalContent } from "./components/modal/contents/shop/ShopModalContent";
import { TantouModalContent } from "./components/modal/contents/tantou/TantouModalContent";
import { SpreadSheetTable } from "./components/table/SpreadSheetTable";
import * as styles from "./spreadSheetView.css";
import {
  SHEET_IDS,
  type SheetId,
  type SheetRowMap,
  type Jugyoin,
  type Kokyuhyo,
  type Shop,
  type Tantou,
} from "@shared/types/spreadsheetTypes";
import { useSpreadSheetViewLogic } from "./useSpreadSheetViewLogic";

// --------------------------------------------------------------------------
// モーダル生成ヘルパー
// --------------------------------------------------------------------------
const renderModalContent = <K extends SheetId>(
  sheetId: K,
  data: SheetRowMap[K],
  title: string,
  onClose: () => void,
): React.ReactNode => {
  switch (sheetId) {
    case SHEET_IDS.KOKYUHYO:
    case SHEET_IDS.JUGYOIN:
      return (
        <JugyoinKokyuhyoModalContent
          data={data as Jugyoin | Kokyuhyo}
          title={title}
          onClose={onClose}
        />
      );

    case SHEET_IDS.SHOP:
      return (
        <ShopModalContent data={data as Shop} title={title} onClose={onClose} />
      );

    case SHEET_IDS.TANTOU:
      return (
        <TantouModalContent
          data={data as Tantou}
          title={title}
          onClose={onClose}
        />
      );

    default:
      return null;
  }
};

export const SpreadSheetView: React.FC = React.memo(() => {
  const {
    sheetId,
    data,
    columns,
    selectedId,
    isFetching,
    loadingMessage,
    config,
  } = useSpreadSheetViewLogic();

  const { openGlobalModal, closeGlobalModal } = useAppStore(
    useShallow((state) => ({
      openGlobalModal: state.openGlobalModal,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const handleRowClick = useCallback(
    (row: SheetRowMap[SheetId]) => {
      const modalConfig = config?.modalConfig;
      if (!modalConfig || !sheetId) return;

      const raw = row as unknown as Record<string, unknown>;

      // ⭕ フォールバック付きの完全なタイトル抽出 (氏名 -> 店舗名 -> 設定タイトル)
      const title =
        (typeof raw.name === "string" && raw.name) ||
        (typeof raw.shopName === "string" && raw.shopName) ||
        config.title ||
        "詳細情報";

      const modalContent = renderModalContent(
        sheetId,
        row,
        title,
        closeGlobalModal,
      );

      if (!modalContent) return;

      openGlobalModal(modalContent, {
        width: modalConfig.modalSize.width,
        height: modalConfig.modalSize.height,
      });
    },
    [config, sheetId, openGlobalModal, closeGlobalModal],
  );

  if (!sheetId) {
    return (
      <div className={styles.errorMessage}>
        有効なスプレッドシートが指定されていません。
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isOpen={isFetching} message={loadingMessage} />

      <div className={styles.viewContainer}>
        <div className={styles.inner}>
          <div className={styles.tableArea}>
            <SpreadSheetTable<SheetRowMap[SheetId]>
              rowKey="id"
              data={data as SheetRowMap[SheetId][]}
              columns={columns}
              onRowClick={handleRowClick}
              selectedId={selectedId}
            />
          </div>
        </div>
      </div>
    </>
  );
});

SpreadSheetView.displayName = "SpreadSheetView";
export default SpreadSheetView;

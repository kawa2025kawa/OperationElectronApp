import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import {
  SHEET_IDS,
  type SheetId,
  type SheetRowMap,
} from "@shared/types/spreadsheetTypes";
import { useAppStore } from "@shared/store";
import { useSpreadSheetViewLogic } from "./useSpreadSheetViewLogic";
import { SpreadSheetTable } from "./components/table/SpreadSheetTable";
import * as styles from "./spreadSheetView.css";

import { JugyoinKokyuhyoModalContent } from "./components/modal/contents/common/JugyoinKokyuhyoModalContent";
import { ShopModalContent } from "./components/modal/contents/shop/ShopModalContent";
import { TantouModalContent } from "./components/modal/contents/tantou/TantouModalContent";

// 🎯 if文の連鎖を排除するためのコンポーネントマッピング定義
const MODAL_RENDERERS: {
  [K in SheetId]?: (
    data: SheetRowMap[K],
    title: string,
    onClose: () => void,
  ) => React.ReactNode;
} = {
  [SHEET_IDS.KOKYUHYO]: (data, title, onClose) => (
    <JugyoinKokyuhyoModalContent data={data} title={title} onClose={onClose} />
  ),
  [SHEET_IDS.JUGYOIN]: (data, title, onClose) => (
    <JugyoinKokyuhyoModalContent data={data} title={title} onClose={onClose} />
  ),
  [SHEET_IDS.SHOP]: (data, title, onClose) => (
    <ShopModalContent data={data} title={title} onClose={onClose} />
  ),
  [SHEET_IDS.TANTOU]: (data, title, onClose) => (
    <TantouModalContent data={data} title={title} onClose={onClose} />
  ),
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

      const renderer = MODAL_RENDERERS[sheetId];
      if (!renderer) return;

      const raw = row as unknown as Record<string, unknown>;
      const title = typeof raw.name === "string" ? raw.name : config.title;

      const modalContent = renderer(row as never, title, closeGlobalModal);

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

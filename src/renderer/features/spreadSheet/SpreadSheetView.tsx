import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { useAppStore } from "@shared/store";
import { type SheetId, type SheetRowMap } from "@shared/types/spreadsheetTypes";

import { SPREADSHEET_MODAL_MAP } from "./components/modal/modalRegistry";
import { SpreadSheetTable } from "./components/table/SpreadSheetTable";
import { useSpreadSheetViewLogic } from "./useSpreadSheetViewLogic";
import * as styles from "./spreadSheetView.css";

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

      const ModalComponent = SPREADSHEET_MODAL_MAP[sheetId];
      if (!ModalComponent) return;

      // 🎯 修正箇所: unknown を挟んで型安全に安全キャスト
      const raw = row as unknown as Record<string, unknown>;

      // フォールバック付きタイトル抽出 (氏名 -> 店舗名 -> 設定タイトル)
      const title =
        (typeof raw.name === "string" && raw.name) ||
        (typeof raw.shopName === "string" && raw.shopName) ||
        config.title ||
        "詳細情報";

      openGlobalModal(
        <ModalComponent
          data={row as never}
          title={title}
          onClose={closeGlobalModal}
        />,
        {
          width: modalConfig.modalSize.width,
          height: modalConfig.modalSize.height,
        },
      );
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

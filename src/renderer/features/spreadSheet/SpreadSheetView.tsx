// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import React, { useCallback } from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import { useAppStore } from "@renderer/store";
import type {
  Jugyoin,
  Kokyuhyo,
  Shop,
  Tantou,
} from "@shared/types/spreadsheet";
import { SpreadSheetModal } from "./components/modal/SpreadSheetModal";
import { SpreadSheetTable } from "./components/table/SpreadSheetTable";
import { useSpreadSheetViewLogic } from "./useSpreadSheetViewLogic";
import * as styles from "./spreadSheetView.css";

type SpreadSheetEntity = Shop | Kokyuhyo | Jugyoin | Tantou;

export const SpreadSheetView: React.FC = React.memo(() => {
  const {
    sheetId,
    data,
    columns,
    selectedId,
    isFetching,
    error,
    handleRetry,
    loadingMessage,
    config,
  } = useSpreadSheetViewLogic();

  const openGlobalModal = useAppStore((state) => state.openGlobalModal);
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);

  const handleRowClick = useCallback(
    (row: SpreadSheetEntity) => {
      const modalConfig = config?.modalConfig;

      if (!modalConfig || !sheetId) return;

      const raw = row as unknown as Record<string, unknown>;

      const title =
        (typeof raw.name === "string" && raw.name) ||
        (typeof raw.shopName === "string" && raw.shopName) ||
        config.title ||
        "詳細情報";

      openGlobalModal(
        <SpreadSheetModal
          sheetId={sheetId as never}
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
      <div className={styles.viewContainer}>
        <EmptyState />
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isOpen={isFetching} message={loadingMessage} />

      <div className={styles.viewContainer}>
        <div className={styles.inner}>
          {error && data.length === 0 && !isFetching ? (
            <EmptyState
              message={`データの取得に失敗しました（${error}）`}
              onRetry={handleRetry}
            />
          ) : (
            <div className={styles.tableArea}>
              <SpreadSheetTable<SpreadSheetEntity>
                rowKey="id"
                data={data as SpreadSheetEntity[]}
                columns={columns as never}
                onRowClick={handleRowClick}
                selectedId={selectedId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
});

SpreadSheetView.displayName = "SpreadSheetView";

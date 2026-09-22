// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import React, { useCallback } from "react";
import { AuthView } from "@renderer/features/auth/AuthView";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { LoadingOverlay } from "@renderer/components/ui/overlay/LoadingOverlay";
import type { SpreadSheetEntity } from "@shared/types/spreadsheet/sheetTypes";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Tantou } from "@shared/types/spreadsheet/tantou";

// Modal Content Components
import { ShopModalContent } from "./components/modal/shop/ShopModalContent";
import { JugyoinModalContent } from "./components/modal/jugyoin/JugyoinModalContent";
import { KokyuhyoModalContent } from "./components/modal/kokyuhyo/KokyuhyoModalContent";
import { TantouModalContent } from "./components/modal/tantou/TantouModalContent";

import { SpreadSheetTable } from "./components/table/SpreadSheetTable";
import { useSpreadSheetViewLogic } from "./useSpreadSheetViewLogic";
import * as styles from "./spreadSheetView.css";

export const SpreadSheetView: React.FC = React.memo(() => {
  const {
    isAuthenticated,
    sheetId,
    data,
    columns,
    selectedId,
    isFetching,
    error,
    handleRetry,
    loadingMessage,
    openGlobalModal,
  } = useSpreadSheetViewLogic();

  const handleRowClick = useCallback(
    (row: SpreadSheetEntity) => {
      if (!sheetId) return;

      const title =
        ("name" in row && typeof row.name === "string" && row.name) ||
        ("shopName" in row &&
          typeof row.shopName === "string" &&
          row.shopName) ||
        "詳細情報";

      switch (sheetId) {
        case "StoreMasterData": {
          const Content = () => <ShopModalContent data={row as Shop} />;
          Object.assign(Content, ShopModalContent);
          openGlobalModal(Content, { title });
          break;
        }
        case "JugyoinMasterData": {
          const Content = () => <JugyoinModalContent data={row as Jugyoin} />;
          Object.assign(Content, JugyoinModalContent);
          openGlobalModal(Content, { title });
          break;
        }
        case "KokyuhyoMasterData": {
          const Content = () => <KokyuhyoModalContent data={row as Kokyuhyo} />;
          Object.assign(Content, KokyuhyoModalContent);
          openGlobalModal(Content, { title });
          break;
        }
        case "KokyuhyoTantouMasterData": {
          const Content = () => <TantouModalContent data={row as Tantou} />;
          Object.assign(Content, TantouModalContent);
          openGlobalModal(Content, { title });
          break;
        }
        default:
          break;
      }
    },
    [sheetId, openGlobalModal],
  );

  // 🎯 未ログイン時は AuthView を最優先で表示
  if (!isAuthenticated) {
    return <AuthView />;
  }

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
            <EmptyState message={`${error}`} onRetry={handleRetry} />
          ) : (
            <div className={styles.tableArea}>
              <SpreadSheetTable
                sheetId={sheetId}
                rowKey="id"
                data={data as SpreadSheetEntity[]}
                columns={columns}
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

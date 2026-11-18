// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import { memo, type ReactNode } from "react";

import type { AppState } from "@renderer/store";
import { AuthView } from "@renderer/features/auth/AuthView";
import type {
  SheetData,
  SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import {
  SpreadSheetTable,
  type SpreadSheetTableProps,
} from "./components/table/SpreadSheetTable";
import {
  useJugyoinView,
  useKokyuhyoView,
  useShopView,
  useSpreadSheetSheetState,
} from "./hooks/useSpreadSheetView";
import * as styles from "./spreadSheetView.css";

type SheetRow<T extends SheetId> = SheetData<T>[number];
type OpenSpreadsheetModal = AppState["openGlobalModal"];

interface BaseSpreadSheetViewProps<T extends SheetId> {
  sheetId: T;
  columns: SpreadSheetTableProps<SheetRow<T>>["columns"];
  getRowId: (row: SheetRow<T>, index: number) => string;
  onRowClick: (row: SheetRow<T>, openModal: OpenSpreadsheetModal) => void;
  headerVariant?: "grouped" | "standard";
  placeholderColumnId?: string;
  placeholderContent?: ReactNode;
  isHolidayCell?: (value: unknown) => boolean;
}

function BaseSpreadSheetView<T extends SheetId>({
  sheetId,
  columns,
  getRowId,
  onRowClick,
  headerVariant,
  placeholderColumnId,
  placeholderContent,
  isHolidayCell,
}: BaseSpreadSheetViewProps<T>) {
  const { isAuthenticated, rows, sheetError, handleRowClick } =
    useSpreadSheetSheetState(sheetId, onRowClick);

  if (!isAuthenticated) return <AuthView />;

  return (
    <div className={styles.viewContainer}>
      <div className={styles.inner}>
        <div className={styles.tableArea}>
          {sheetError ? (
            <div className={styles.errorContainer} role="alert">
              <div className={styles.errorTitle}>データ取得エラー</div>
              <div className={styles.errorMessage}>{sheetError}</div>
            </div>
          ) : (
            <SpreadSheetTable
              rows={rows}
              columns={columns}
              getRowId={getRowId}
              onRowClick={handleRowClick}
              headerVariant={headerVariant}
              placeholderColumnId={placeholderColumnId}
              placeholderContent={placeholderContent}
              isHolidayCell={isHolidayCell}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const JugyoinView = memo(function JugyoinView() {
  const viewProps = useJugyoinView();
  return <BaseSpreadSheetView {...viewProps} />;
});
JugyoinView.displayName = "JugyoinView";

export const KokyuhyoView = memo(function KokyuhyoView() {
  const viewProps = useKokyuhyoView();
  return <BaseSpreadSheetView {...viewProps} />;
});
KokyuhyoView.displayName = "KokyuhyoView";

export const ShopView = memo(function ShopView() {
  const viewProps = useShopView();
  return <BaseSpreadSheetView {...viewProps} />;
});
ShopView.displayName = "ShopView";
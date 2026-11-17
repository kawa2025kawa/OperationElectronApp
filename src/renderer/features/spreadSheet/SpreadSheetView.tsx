// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import { memo, useCallback, useMemo, type ReactNode } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { AuthView } from "@renderer/features/auth/AuthView";
import { TantouButton } from "@renderer/components/ui/button/tantouButton/TantouButton";
import { MODAL_SIZES } from "@shared/types/ui/modal";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type SheetData,
  type SheetId,
  type Shop,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import {
  SpreadSheetTable,
  type SpreadSheetTableProps,
} from "./components/table/SpreadSheetTable";
import { ScheduleModalContent } from "./components/modal/ScheduleModalContent";
import { ShopModalContent } from "./shop/modal/ShopModalContent";
import { getJugyoinColumns } from "./jugyoin/table/jugyoinTableConfig";
import { getKokyuhyoColumns } from "./kokyuhyo/table/kokyuhyoTableConfig";
import { SHOP_COLUMNS } from "./shop/table/shopTableConfig";
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

const EMPTY_SHEET_ROWS: readonly never[] = Object.freeze([]);
const HOLIDAY_WORDS = ["公休", "有休", "〇連", "特休", "希休", "休"] as const;

function isHolidayText(value: unknown): boolean {
  const text = value == null ? "" : String(value);
  return HOLIDAY_WORDS.some((word) => text.includes(word));
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
  const { openGlobalModal, isAuthenticated, rows, sheetError } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
      rows: state.sheetData[sheetId]?.data ?? EMPTY_SHEET_ROWS,
      sheetError: state.sheetErrors[sheetId],
    })),
  );

  const handleRowClick = useCallback(
    (row: SheetRow<T>) => onRowClick(row, openGlobalModal),
    [onRowClick, openGlobalModal],
  );

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
  const columns = useMemo(() => getJugyoinColumns(), []);

  const handleRowClick = useCallback(
    (row: Jugyoin, openModal: OpenSpreadsheetModal) => {
      openModal(<ScheduleModalContent data={row} />, {
        title: row.name || "",
        ...MODAL_SIZES.ULTRA_WIDE_21_9,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.JUGYOIN.sheetName}
      columns={columns}
      getRowId={(row, index) =>
        row.id
          ? `${row.id}_${index}`
          : `${row.name ? String(row.name).trim() : "jugyoin"}_${index}`
      }
      onRowClick={handleRowClick}
    />
  );
});
JugyoinView.displayName = "JugyoinView";

export const KokyuhyoView = memo(function KokyuhyoView() {
  const columns = useMemo(() => getKokyuhyoColumns(), []);

  const handleRowClick = useCallback(
    (row: Kokyuhyo, openModal: OpenSpreadsheetModal) => {
      openModal(<ScheduleModalContent data={row} />, {
        title: row.name || "",
        ...MODAL_SIZES.KOKYUHYO,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.KOKYUHYO.sheetName}
      columns={columns}
      getRowId={(row, index) =>
        row.id
          ? `${row.id}_${index}`
          : `${row.name ? String(row.name).trim() : "kokyuhyo"}_${index}`
      }
      onRowClick={handleRowClick}
      placeholderColumnId="name"
      placeholderContent={<TantouButton />}
      isHolidayCell={isHolidayText}
    />
  );
});
KokyuhyoView.displayName = "KokyuhyoView";

export const ShopView = memo(function ShopView() {
  const handleRowClick = useCallback(
    (row: Shop, openModal: OpenSpreadsheetModal) => {
      openModal(<ShopModalContent data={row} />, {
        title: row.shopName || "",
        ...MODAL_SIZES.SHOP,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.STORE.sheetName}
      columns={SHOP_COLUMNS}
      getRowId={(row, index) =>
        row.shopCode
          ? `${String(row.shopCode).trim()}_${index}`
          : `shop_${index}`
      }
      onRowClick={handleRowClick}
      headerVariant="standard"
    />
  );
});
ShopView.displayName = "ShopView";

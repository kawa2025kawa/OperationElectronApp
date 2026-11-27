// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import { createElement, memo, useCallback, useMemo, type ReactNode } from "react";
import { useShallow } from "zustand/shallow";

import { AuthView } from "@renderer/features/auth/AuthView";
import { useAppStore, type AppState } from "@renderer/store";
import {
  SHEETS,
  type PublicShop,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { MODAL_SIZES } from "@renderer/types/modal";

import {
  ScheduleModalContent,
  type ScheduleModalContentProps,
} from "./components/modal/ScheduleModalContent";
import {
  SpreadSheetTable,
  type SpreadSheetTableProps,
} from "./components/table/SpreadSheetTable";
import { isSpreadSheetHolidayText } from "./components/table/spreadsheetTableConfig";
import {
  getJugyoinColumns,
  getJugyoinRowId,
} from "./jugyoin/table/jugyoinTableConfig";
import {
  getKokyuhyoColumns,
  getKokyuhyoRowId,
} from "./kokyuhyo/table/kokyuhyoTableConfig";
import { ShopModalContent } from "./shop/modal/ShopModalContent";
import { getShopRowId, SHOP_COLUMNS } from "./shop/table/shopTableConfig";
import { resolveScheduleBaseDate } from "./utils/spreadsheetDateUtils";
import * as styles from "./spreadSheetView.css";

interface ModalDimension {
  readonly width: string;
  readonly height: string;
}

type SheetRow<T extends SheetId> = SheetData<T>[number];
type OpenSpreadsheetModal = AppState["openGlobalModal"];

const EMPTY_SHEET_ROWS: readonly never[] = Object.freeze([]);

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
  const { openGlobalModal, isAuthenticated, rows, sheetError } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
      rows: (state.sheetData[sheetId]?.data ?? EMPTY_SHEET_ROWS) as SheetData<T>,
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

function createScheduleSheetView<
  T extends typeof SHEETS.JUGYOIN.sheetName | typeof SHEETS.KOKYUHYO.sheetName,
>(params: {
  displayName: string;
  sheetId: T;
  updatedAtKey: "jugyoinUpdatedAt" | "kokyuhyoUpdatedAt";
  getColumns: (
    baseDate?: Date,
  ) => SpreadSheetTableProps<SheetRow<T>>["columns"];
  getRowId: (row: SheetRow<T>, index: number) => string;
  modalSize: ModalDimension;
}) {
  const {
    displayName,
    sheetId,
    updatedAtKey,
    getColumns,
    getRowId,
    modalSize,
  } = params;

  const Component = memo(function ScheduleSheetView() {
    const updatedAt = useAppStore(
      (state: AppState) => state.dailyUpdateStatus?.[updatedAtKey],
    );
    const baseDate = useMemo(
      () => resolveScheduleBaseDate(updatedAt),
      [updatedAt],
    );
    const columns = useMemo(() => getColumns(baseDate), [baseDate]);

    const handleOpenModal = useCallback(
      (row: SheetRow<T>, openModal: OpenSpreadsheetModal) => {
        openModal(
          createElement(ScheduleModalContent, {
            data: row as ScheduleModalContentProps["data"],
          }),
          {
            title: row.name || "",
            ...modalSize,
          },
        );
      },
      [],
    );

    return (
      <BaseSpreadSheetView
        sheetId={sheetId}
        columns={columns}
        getRowId={getRowId}
        onRowClick={handleOpenModal}
        isHolidayCell={isSpreadSheetHolidayText}
      />
    );
  });

  Component.displayName = displayName;
  return Component;
}

export const JugyoinView = createScheduleSheetView({
  displayName: "JugyoinView",
  sheetId: SHEETS.JUGYOIN.sheetName,
  updatedAtKey: "jugyoinUpdatedAt",
  getColumns: getJugyoinColumns,
  getRowId: getJugyoinRowId,
  modalSize: MODAL_SIZES.ULTRA_WIDE_21_9,
});

export const KokyuhyoView = createScheduleSheetView({
  displayName: "KokyuhyoView",
  sheetId: SHEETS.KOKYUHYO.sheetName,
  updatedAtKey: "kokyuhyoUpdatedAt",
  getColumns: getKokyuhyoColumns,
  getRowId: getKokyuhyoRowId,
  modalSize: MODAL_SIZES.KOKYUHYO,
});

export const ShopView = memo(function ShopView() {
  const handleOpenModal = useCallback(
    (row: PublicShop, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ShopModalContent, { data: row }), {
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
      getRowId={getShopRowId}
      onRowClick={handleOpenModal}
      headerVariant="standard"
    />
  );
});
ShopView.displayName = "ShopView";

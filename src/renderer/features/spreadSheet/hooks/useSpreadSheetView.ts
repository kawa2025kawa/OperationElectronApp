// src/renderer/features/spreadSheet/hooks/useSpreadSheetView.ts

import { createElement, useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { MODAL_SIZES } from "@shared/types/ui/modal";
import {
  SHEETS,
  type PublicJugyoin,
  type PublicKokyuhyo,
  type PublicShop,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { ScheduleModalContent } from "../components/modal/ScheduleModalContent";
import { isSpreadSheetHolidayText } from "../components/table/spreadsheetTableConfig";
import { ShopModalContent } from "../shop/modal/ShopModalContent";
import {
  getJugyoinColumns,
  getJugyoinRowId,
} from "../jugyoin/table/jugyoinTableConfig";
import {
  getKokyuhyoColumns,
  getKokyuhyoRowId,
} from "../kokyuhyo/table/kokyuhyoTableConfig";
import { getShopRowId, SHOP_COLUMNS } from "../shop/table/shopTableConfig";
import { resolveScheduleBaseDate } from "../utils/spreadsheetDateUtils";

type SheetRow<T extends SheetId> = SheetData<T>[number];
type OpenSpreadsheetModal = AppState["openGlobalModal"];

const EMPTY_SHEET_ROWS: readonly never[] = Object.freeze([]);

export function useSpreadSheetSheetState<T extends SheetId>(
  sheetId: T,
  onRowClick: (row: SheetRow<T>, openModal: OpenSpreadsheetModal) => void,
) {
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

  return {
    isAuthenticated,
    rows,
    sheetError,
    handleRowClick,
  };
}

export function useJugyoinView() {
  const jugyoinUpdatedAt = useAppStore(
    (state: AppState) => state.dailyUpdateStatus?.jugyoinUpdatedAt,
  );
  const baseDate = useMemo(
    () => resolveScheduleBaseDate(jugyoinUpdatedAt),
    [jugyoinUpdatedAt],
  );
  const columns = useMemo(() => getJugyoinColumns(baseDate), [baseDate]);

  const handleOpenModal = useCallback(
    (row: PublicJugyoin, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ScheduleModalContent, { data: row }), {
        title: row.name || "",
        ...MODAL_SIZES.ULTRA_WIDE_21_9,
      });
    },
    [],
  );

  return {
    sheetId: SHEETS.JUGYOIN.sheetName,
    columns,
    getRowId: getJugyoinRowId,
    onRowClick: handleOpenModal,
    isHolidayCell: isSpreadSheetHolidayText,
  };
}

export function useKokyuhyoView() {
  const kokyuhyoUpdatedAt = useAppStore(
    (state: AppState) => state.dailyUpdateStatus?.kokyuhyoUpdatedAt,
  );
  const baseDate = useMemo(
    () => resolveScheduleBaseDate(kokyuhyoUpdatedAt),
    [kokyuhyoUpdatedAt],
  );
  const columns = useMemo(() => getKokyuhyoColumns(baseDate), [baseDate]);

  const handleOpenModal = useCallback(
    (row: PublicKokyuhyo, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ScheduleModalContent, { data: row }), {
        title: row.name || "",
        ...MODAL_SIZES.KOKYUHYO,
      });
    },
    [],
  );

  return {
    sheetId: SHEETS.KOKYUHYO.sheetName,
    columns,
    getRowId: getKokyuhyoRowId,
    onRowClick: handleOpenModal,
    isHolidayCell: isSpreadSheetHolidayText,
  };
}

export function useShopView() {
  const handleOpenModal = useCallback(
    (row: PublicShop, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ShopModalContent, { data: row }), {
        title: row.shopName || "",
        ...MODAL_SIZES.SHOP,
      });
    },
    [],
  );

  return {
    sheetId: SHEETS.STORE.sheetName,
    columns: SHOP_COLUMNS,
    getRowId: getShopRowId,
    onRowClick: handleOpenModal,
    headerVariant: "standard" as const,
  };
}
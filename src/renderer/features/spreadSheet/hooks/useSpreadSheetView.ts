// src/renderer/features/spreadSheet/hooks/useSpreadSheetView.ts

import { createElement, useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { MODAL_SIZES } from "@shared/types/ui/modal";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type SheetData,
  type SheetId,
  type Shop,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { ScheduleModalContent } from "../components/modal/ScheduleModalContent";
import { ShopModalContent } from "../shop/modal/ShopModalContent";
import {
  getJugyoinColumns,
  getJugyoinRowId,
} from "../jugyoin/table/jugyoinTableConfig";
import {
  getKokyuhyoColumns,
  getKokyuhyoRowId,
  isKokyuhyoHolidayText,
} from "../kokyuhyo/table/kokyuhyoTableConfig";
import { getShopRowId, SHOP_COLUMNS } from "../shop/table/shopTableConfig";

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
  const columns = useMemo(() => getJugyoinColumns(), []);

  const handleOpenModal = useCallback(
    (row: Jugyoin, openModal: OpenSpreadsheetModal) => {
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
  };
}

export function useKokyuhyoView() {
  const columns = useMemo(() => getKokyuhyoColumns(), []);

  const handleOpenModal = useCallback(
    (row: Kokyuhyo, openModal: OpenSpreadsheetModal) => {
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
    isHolidayCell: isKokyuhyoHolidayText,
  };
}

export function useShopView() {
  const handleOpenModal = useCallback(
    (row: Shop, openModal: OpenSpreadsheetModal) => {
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
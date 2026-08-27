// src/renderer/features/spreadSheet/components/modal/modalRegistry.ts
import React from "react";
import {
  SHEET_IDS,
  type SheetId,
  type SheetRowMap,
} from "@shared/types/spreadsheetTypes";
import { JugyoinModalContent } from "./jugyoin/JugyoinModalContent";
import { KokyuhyoModalContent } from "./kokyuhyo/KokyuhyoModalContent";
import { ShopModalContent } from "./shop/ShopModalContent";
import { TantouModalContent } from "./tantou/TantouModalContent";

export interface SpreadSheetModalProps<T = unknown> {
  data: T;
  title?: string;
  onClose?: () => void;
}

type ModalComponentMap = {
  [K in SheetId]: React.ComponentType<SpreadSheetModalProps<SheetRowMap[K]>>;
};

export const SPREADSHEET_MODAL_MAP: ModalComponentMap = {
  [SHEET_IDS.JUGYOIN]: JugyoinModalContent as React.ComponentType<
    SpreadSheetModalProps<SheetRowMap[typeof SHEET_IDS.JUGYOIN]>
  >,
  [SHEET_IDS.KOKYUHYO]: KokyuhyoModalContent as React.ComponentType<
    SpreadSheetModalProps<SheetRowMap[typeof SHEET_IDS.KOKYUHYO]>
  >,
  [SHEET_IDS.SHOP]: ShopModalContent as React.ComponentType<
    SpreadSheetModalProps<SheetRowMap[typeof SHEET_IDS.SHOP]>
  >,
  [SHEET_IDS.TANTOU]: TantouModalContent as React.ComponentType<
    SpreadSheetModalProps<SheetRowMap[typeof SHEET_IDS.TANTOU]>
  >,
};

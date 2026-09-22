// src/renderer/features/spreadSheet/services/mappers/domain/spreadsheetMapper.ts

import { SHOP_FIELD_LABELS, type Shop } from "@shared/types/spreadsheet/shop";
import {
  KOKYUHYO_FIELD_LABELS,
  type Kokyuhyo,
} from "@shared/types/spreadsheet/kokyuhyo";
import {
  JUGYOIN_FIELD_LABELS,
  type Jugyoin,
} from "@shared/types/spreadsheet/jugyoin";
import {
  TANTOU_FIELD_LABELS,
  type Tantou,
} from "@shared/types/spreadsheet/tantou";

import { parseGenericSheet } from "../utils/parseUtils";

export const parseShopSheet = (rows: string[][]): Shop[] =>
  parseGenericSheet<Shop>(rows, "shop", Object.keys(SHOP_FIELD_LABELS));

export const parseKokyuhyoSheet = (rows: string[][]): Kokyuhyo[] =>
  parseGenericSheet<Kokyuhyo>(
    rows,
    "kokyuhyo",
    Object.keys(KOKYUHYO_FIELD_LABELS),
  );

export const parseJugyoinSheet = (rows: string[][]): Jugyoin[] =>
  parseGenericSheet<Jugyoin>(
    rows,
    "jugyoin",
    Object.keys(JUGYOIN_FIELD_LABELS),
  );

export const parseTantouSheet = (rows: string[][]): Tantou[] =>
  parseGenericSheet<Tantou>(rows, "tantou", Object.keys(TANTOU_FIELD_LABELS));

// src/shared/types/spreadsheet/shop.ts

// =============================================================================
// 1. 定数・繰り返し項目の定義
// =============================================================================

export const PRINTER_TYPES = ["B", "K", "O"] as const;
export type PrinterType = (typeof PRINTER_TYPES)[number];

export const TR_INDICES = [1, 2, 3, 4] as const;
export type TrIndex = (typeof TR_INDICES)[number];

// =============================================================================
// 2. フィールドラベル定義（UI表示用）
// =============================================================================

/**
 * 基本情報・固定フィールドのラベル定義
 */
const BASE_SHOP_FIELD_LABELS = {
  // 基本店舗情報（idを削除し、実シートの列順・構成と完全一致）
  shopCode: "店舗コード",
  shopName: "店舗名",
  shopKana: "店舗カナ",
  openTime: "開店時間",
  closeTime: "閉店時間",
  centerName: "担当センタ",
  areaName: "エリア名",
  phoneNumber: "電話番号",
  postalCode: "郵便番号",
  address: "住所",
  mobileSales: "移動販売",

  // 担当者・役職
  storeManagerName: "店長",
  assistantManagerName1: "副店長1",
  assistantManagerName2: "副店長2",
  areaManagerName: "マネージャ",

  // ファイルパス
  excelFilePath: "Excelパス",
  pdfFilePath: "PDFパス",

  // タイムレコーダーサマリー・設備・画像
  deviceCount: "端末台数",
  comment: "コメント",
  hubImageUrl: "HUB",
  outletImageUrl: "コンセント",
} as const;

/**
 * プリンター (B, K, O) フィールドのラベル定義
 */
const PRINTER_FIELD_LABELS = {
  ...Object.fromEntries(
    PRINTER_TYPES.flatMap((t) => [
      [`printerModel${t}`, `プリンター(${t}) 機種名`],
      [`printerSerialNumber${t}`, `プリンター(${t}) シリアル`],
      [`printerPhone${t}`, `プリンター(${t}) 連絡先`],
      [`printerHolidayPhone${t}`, `プリンター(${t}) 休保`],
      [`printerContractId${t}`, `プリンター(${t}) 契約ID`],
    ]),
  ),
} as {
  [K in PrinterType as
    | `printerModel${K}`
    | `printerSerialNumber${K}`
    | `printerPhone${K}`
    | `printerHolidayPhone${K}`
    | `printerContractId${K}`]: string;
};

/**
 * タイムレコーダー (TR 1〜4) フィールドのラベル定義
 */
const TR_FIELD_LABELS = {
  ...Object.fromEntries(
    TR_INDICES.flatMap((i) => [
      [`tr${i}Name`, `TR${i} 端末名`],
      [`tr${i}Ip`, `TR${i} IP`],
      [`tr${i}Model`, `TR${i} 型番`],
      [`tr${i}LogicalName`, `TR${i} 論理`],
      [`tr${i}PhysicalName`, `TR${i} 物理`],
      [`tr${i}ImageUrl`, `TR${i} 画像`],
    ]),
  ),
} as {
  [K in TrIndex as
    | `tr${K}Name`
    | `tr${K}Ip`
    | `tr${K}Model`
    | `tr${K}LogicalName`
    | `tr${K}PhysicalName`
    | `tr${K}ImageUrl`]: string;
};

// =============================================================================
// 3. 全フィールドラベルの統合オブジェクト
// =============================================================================

export const SHOP_FIELD_LABELS = {
  ...BASE_SHOP_FIELD_LABELS,
  ...PRINTER_FIELD_LABELS,
  ...TR_FIELD_LABELS,
} as const;

// =============================================================================
// 4. 型定義のエクスポート
// =============================================================================

export type ShopKey = keyof typeof SHOP_FIELD_LABELS;

/**
 * スプレッドシートの1行分の店舗レコード型
 */
export type Shop = Record<ShopKey, string>;

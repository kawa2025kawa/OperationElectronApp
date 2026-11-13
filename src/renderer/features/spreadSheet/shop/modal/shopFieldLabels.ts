// src/renderer/features/spreadSheet/shop/modal/shopFieldLabels.ts

const PRINTER_TYPES = ["B", "K", "O"] as const;
type PrinterType = (typeof PRINTER_TYPES)[number];

const TR_INDICES = [1, 2, 3, 4] as const;
type TrIndex = (typeof TR_INDICES)[number];

const BASE_SHOP_FIELD_LABELS = {
  shopCode: "店舗コード",
  shopName: "店舗名",
  shopKana: "店舗カナ",
  openTime: "開店時間",
  closeTime: "閉店時間",
  centerName: "センタ",
  areaName: "エリア",
  phoneNumber: "電話番号",
  postalCode: "郵便番号",
  address: "住所",
  mobileSales: "移動販売",

  storeManagerName: "店長",
  assistantManagerName1: "副店長1",
  assistantManagerName2: "副店長2",
  areaManagerName: "マネージャ",

  excelFilePath: "Excelパス",
  pdfFilePath: "PDFパス",

  deviceCount: "端末台数",
  comment: "コメント",
  hubImageUrl: "HUB",
  outletImageUrl: "コンセント",
} as const;

const PRINTER_FIELD_LABELS = {
  ...Object.fromEntries(
    PRINTER_TYPES.flatMap((type) => [
      [`printerModel${type}`, `プリンター(${type}) 機種名`],
      [`printerSerialNumber${type}`, `プリンター(${type}) シリアル`],
      [`printerPhone${type}`, `プリンター(${type}) 連絡先`],
      [`printerHolidayPhone${type}`, `プリンター(${type}) 休日連絡先`],
      [`printerContractId${type}`, `プリンター(${type}) 土日祝ID`],
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

const TR_FIELD_LABELS = {
  ...Object.fromEntries(
    TR_INDICES.flatMap((index) => [
      [`tr${index}Name`, `TR${index} 端末名`],
      [`tr${index}Ip`, `TR${index} IP`],
      [`tr${index}Model`, `TR${index} 型番`],
      [`tr${index}LogicalName`, `TR${index} 論理`],
      [`tr${index}PhysicalName`, `TR${index} 物理`],
      [`tr${index}ImageUrl`, `TR${index} 画像`],
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

export const SHOP_FIELD_LABELS = {
  ...BASE_SHOP_FIELD_LABELS,
  ...PRINTER_FIELD_LABELS,
  ...TR_FIELD_LABELS,
} as const;

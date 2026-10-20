// src/shared/types/spreadsheet/shop.ts

/**
 * 1. 各フィールドの「キー」と「日本語ラベル」を一元管理するオブジェクト
 */
export const SHOP_FIELD_LABELS = {
  id: "ID",
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

  // プリンター (B)
  printerModelB: "機種名",
  printerSerialB: "シリアル",
  printerCallB: "連絡先",
  printerHolidayB: "休保",
  printerContractIdB: "契約ID",

  // プリンター (K)
  printerModelK: "機種名",
  printerSerialK: "シリアル",
  printerCallK: "連絡先",
  printerHolidayK: "休保",
  printerContractIdK: "契約ID",

  // プリンター (O)
  printerModelO: "機種名",
  printerSerialO: "シリアル",
  printerCallO: "連絡先",
  printerHolidayO: "休保",
  printerContractIdO: "契約ID",

  // 担当者・役職
  tencyoName: "店長",
  hukuTencyoName1: "副店長1",
  hukuTencyoName2: "副店長2",
  managerName: "マネージャ",

  // ファイルパス
  excelFilePath: "Excelパス",
  pdfFilePath: "PDFパス",

  // タイムレコーダー・端末情報
  deviceCount: "端末台数",
  tr1: "TR1 端末名",
  tr1Ip: "TR1 IP",
  tr1Model: "TR1 型番",
  tr1Ronri: "TR1 論理",
  tr1Butsuri: "TR1 物理",

  tr2: "TR2 端末名",
  tr2Ip: "TR2 IP",
  tr2Model: "TR2 型番",
  tr2Ronri: "TR2 論理",
  tr2Butsuri: "TR2 物理",

  tr3: "TR3 端末名",
  tr3Ip: "TR3 IP",
  tr3Model: "TR3 型番",
  tr3Ronri: "TR3 論理",
  tr3Butsuri: "TR3 物理",

  tr4: "TR4 端末名",
  tr4Ip: "TR4 IP",
  tr4Model: "TR4 型番",
  tr4Ronri: "TR4 論理",
  tr4Butsuri: "TR4 物理",

  comment: "コメント",

  // 画像・メディア参照
  tr1ImageUrl: "TR1",
  tr2ImageUrl: "TR2",
  tr3ImageUrl: "TR3",
  tr4ImageUrl: "TR4",
  hub: "HUB",
  outlet: "コンセント",
} as const;

/**
 * 2. オブジェクトのキーから Shop 型を自動生成
 * （型定義を別で手書きする必要がなくなります）
 */
export type ShopKey = keyof typeof SHOP_FIELD_LABELS;
export type Shop = Record<ShopKey, string>;

// src/renderer/features/spreadSheet/services/mappers/shopMapper.ts

import type { Shop } from "@shared/types/spreadsheet/shop";
import { getValue, parseRawToFlatObjects } from "./commonMapper";

export function parseShopSheet(rawRows: string[][]): Shop[] {
  const flatRows = parseRawToFlatObjects(rawRows);

  return flatRows.map(
    (flat, idx): Shop => ({
      id: getValue(flat, ["shopCode"], `shop_${flat._rowIdx ?? idx + 1}`),

      shopCode: getValue(flat, ["shopCode"]),
      shopName: getValue(flat, ["shopName"]),
      shopKana: getValue(flat, ["shopKana"]),

      openTime: getValue(flat, ["openTime"]),
      closeTime: getValue(flat, ["closeTime"]),

      centerName: getValue(flat, ["centerName"]),
      areaName: getValue(flat, ["areaName"]),

      phoneNumber: getValue(flat, ["phoneNumber"]),
      postalCode: getValue(flat, ["postalCode"]),
      address: getValue(flat, ["address"]),

      mobileSales: getValue(flat, ["mobileSales"]),

      // ★ 欠落していた担当者プロパティを追加（スプレッドシートヘッダーの候補キーを指定）
      tencyoName: getValue(flat, ["tencyoName", "tencyo", "店長"]),
      hukuTencyoName1: getValue(flat, [
        "hukuTencyoName1",
        "hukuTencyo1",
        "副店長1",
      ]),
      hukuTencyoName2: getValue(flat, [
        "hukuTencyoName2",
        "hukuTencyo2",
        "副店長2",
      ]),
      managerName: getValue(flat, [
        "managerName",
        "manager",
        "エリアMGR",
        "マネージャー",
      ]),

      printerModelB: getValue(flat, ["printerModelB"]),
      printerSerialB: getValue(flat, ["printerSerialB"]),
      printerCallB: getValue(flat, ["printerCallB"]),
      printerHolidayB: getValue(flat, ["printerHolidayB"]),
      printerContractIdB: getValue(flat, ["printerContractIdB"]),

      printerModelK: getValue(flat, ["printerModelK"]),
      printerSerialK: getValue(flat, ["printerSerialK"]),
      printerCallK: getValue(flat, ["printerCallK"]),
      printerHolidayK: getValue(flat, ["printerHolidayK"]),
      printerContractIdK: getValue(flat, ["printerContractIdK"]),

      printerModelO: getValue(flat, ["printerModelO"]),
      printerSerialO: getValue(flat, ["printerSerialO"]),
      printerCallO: getValue(flat, ["printerCallO"]),
      printerHolidayO: getValue(flat, ["printerHolidayO"]),
      printerContractIdO: getValue(flat, ["printerContractIdO"]),

      excelFilePath: getValue(flat, ["excelFilePath"]),
      pdfFilePath: getValue(flat, ["pdfFilePath"]),

      deviceCount: getValue(flat, ["deviceCount"]),

      tr1: getValue(flat, ["tr1"]),
      tr1Ip: getValue(flat, ["tr1_ip"]),
      tr1Model: getValue(flat, ["tr1_model"]),
      tr1Ronri: getValue(flat, ["tr1_ronri"]),
      tr1Butsuri: getValue(flat, ["tr1_butsuri"]),

      tr2: getValue(flat, ["tr2"]),
      tr2Ip: getValue(flat, ["tr2_ip"]),
      tr2Model: getValue(flat, ["tr2_model"]),
      tr2Ronri: getValue(flat, ["tr2_ronri"]),
      tr2Butsuri: getValue(flat, ["tr2_butsuri"]),

      tr3: getValue(flat, ["tr3"]),
      tr3Ip: getValue(flat, ["tr3_ip"]),
      tr3Model: getValue(flat, ["tr3_model"]),
      tr3Ronri: getValue(flat, ["tr3_ronri"]),
      tr3Butsuri: getValue(flat, ["tr3_butsuri"]),

      tr4: getValue(flat, ["tr4"]),
      tr4Ip: getValue(flat, ["tr4_ip"]),
      tr4Model: getValue(flat, ["tr4_model"]),
      tr4Ronri: getValue(flat, ["tr4_ronri"]),
      tr4Butsuri: getValue(flat, ["tr4_butsuri"]),

      comment: getValue(flat, ["comment"]),

      timeRecorder1: getValue(flat, ["timeRecorder1"]),
      timeRecorder2: getValue(flat, ["timeRecorder2"]),
      timeRecorder3: getValue(flat, ["timeRecorder3"]),
      timeRecorder4: getValue(flat, ["timeRecorder4"]),

      hub: getValue(flat, ["hub"]),
      outlet: getValue(flat, ["outlet"]),
    }),
  );
}

// src/renderer/features/spreadSheet/components/modal/contents/shop/useShopModalLogic.ts
import { useState, useMemo } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { Shop } from "@shared/types/spreadsheetTypes";

export const SHOP_MODAL_GROUPS = [
  {
    title: "基本情報",
    keywords: ["businessHours", "phoneNumber", "idoHanbai", "address"],
  },
  {
    title: "担当者情報",
    keywords: [
      "managerName",
      "subManagerName1",
      "area",
      "areaManagerName",
      "centerName",
    ],
  },
  {
    title: "プリンターK",
    keywords: [
      "printerK.model",
      "printerK.serial",
      "printerK.callTarget",
      "printerK.weekendSupport",
      "printerK.contractId",
    ],
  },
  {
    title: "プリンターB",
    keywords: [
      "printerB.model",
      "printerB.serial",
      "printerB.callTarget",
      "printerB.weekendSupport",
      "printerB.contractId",
    ],
  },
  {
    title: "プリンターO",
    keywords: [
      "printerO.model",
      "printerO.serial",
      "printerO.callTarget",
      "printerO.weekendSupport",
      "printerO.contractId",
    ],
  },
] as const;

export const SHOP_LABEL_MAP: Record<string, string> = {
  phoneNumber: "電話番号",
  address: "住所",
  businessHours: "営業時間",
  idoHanbai: "移動販売",
  managerName: "店長名",
  subManagerName1: "副店長名",
  area: "エリア",
  areaManagerName: "AM名",
  centerName: "センター名",
  "printerK.model": "Kモデル",
  "printerK.serial": "Kシリアル",
  "printerK.callTarget": "K連絡先",
  "printerK.weekendSupport": "K休日対応",
  "printerK.contractId": "K契約ID",
  "printerB.model": "Bモデル",
  "printerB.serial": "Bシリアル",
  "printerB.callTarget": "B連絡先",
  "printerB.weekendSupport": "B休日対応",
  "printerB.contractId": "B契約ID",
  "printerO.model": "Oモデル",
  "printerO.serial": "Oシリアル",
  "printerO.callTarget": "O連絡先",
  "printerO.weekendSupport": "O休日対応",
  "printerO.contractId": "O契約ID",
};

export function useShopModalLogic(data: Shop) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo(() => {
    return SHOP_MODAL_GROUPS.map((group) => ({
      title: group.title,
      items: group.keywords.map((kw) => ({
        label: SHOP_LABEL_MAP[kw] || kw,
        value: getValueByPath(data as unknown as Record<string, unknown>, kw),
      })),
    }));
  }, [data]);

  const displayItems = groups[selectedIndex]?.items ?? [];

  return { groups, selectedIndex, setSelectedIndex, displayItems };
}

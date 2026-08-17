import type { Shop } from "../../../../types/spreadsheetTypes";
import {
  useTabbedModalLogic,
  type TabGroupConfig,
} from "../common/useTabbedModalLogic";

export const SHOP_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "基本情報",
    items: [
      { key: "businessHours", label: "営業時間" },
      { key: "phoneNumber", label: "電話番号" },
      { key: "idoHanbai", label: "移動販売" },
      { key: "address", label: "住所" },
    ],
  },
  {
    title: "担当者情報",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "担当センター" },
    ],
  },
  {
    title: "プリンター(K)",
    items: [
      { key: "printerK.model", label: "K機種" },
      { key: "printerK.serial", label: "Kシリアル" },
      { key: "printerK.callTarget", label: "K連絡先" },
      { key: "printerK.weekendSupport", label: "K休日対応" },
      { key: "printerK.contractId", label: "K契約ID" },
    ],
  },
  {
    title: "プリンター(B)",
    items: [
      { key: "printerB.model", label: "B機種" },
      { key: "printerB.serial", label: "Bシリアル" },
      { key: "printerB.callTarget", label: "B連絡先" },
      { key: "printerB.weekendSupport", label: "B休日対応" },
      { key: "printerB.contractId", label: "B契約ID" },
    ],
  },
  {
    title: "プリンター(O)",
    items: [
      { key: "printerO.model", label: "O機種" },
      { key: "printerO.serial", label: "Oシリアル" },
      { key: "printerO.callTarget", label: "O連絡先" },
      { key: "printerO.weekendSupport", label: "O休日対応" },
      { key: "printerO.contractId", label: "O契約ID" },
    ],
  },
] as const;

export function useShopModalLogic(data: Shop) {
  return useTabbedModalLogic(
    data as unknown as Record<string, unknown>,
    SHOP_MODAL_GROUPS,
  );
}

// src/renderer/features/spreadSheet/components/modal/contents/shop/ShopModalContent.tsx
import React from "react";
import type { Shop } from "@shared/types/spreadsheetTypes";
import {
  SpreadSheetModal,
  type TabGroupConfig,
} from "@renderer/features/spreadSheet/components/modal/SpreadSheetModal";

const SHOP_MODAL_GROUPS: readonly TabGroupConfig[] = [
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
    title: "担当者",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "センター" },
    ],
  },
  {
    title: "プリンター(K)",
    items: [
      { key: "printerK.model", label: "K機種" },
      { key: "printerK.serial", label: "Kシリアル" },
      { key: "printerK.callTarget", label: "Kコール先" },
      { key: "printerK.weekendSupport", label: "K休祝日対応" },
      { key: "printerK.contractId", label: "K契約ID" },
    ],
  },
  {
    title: "プリンター(B)",
    items: [
      { key: "printerB.model", label: "B機種" },
      { key: "printerB.serial", label: "Bシリアル" },
      { key: "printerB.callTarget", label: "Bコール先" },
      { key: "printerB.weekendSupport", label: "B休祝日対応" },
      { key: "printerB.contractId", label: "B契約ID" },
    ],
  },
  {
    title: "プリンター(O)",
    items: [
      { key: "printerO.model", label: "O機種" },
      { key: "printerO.serial", label: "Oシリアル" },
      { key: "printerO.callTarget", label: "Oコール先" },
      { key: "printerO.weekendSupport", label: "O休祝日対応" },
      { key: "printerO.contractId", label: "O契約ID" },
    ],
  },
] as const;

export const ShopModalContent: React.FC<{
  data: Shop;
  title: string;
  onClose: () => void;
}> = React.memo(({ data, title, onClose }) => (
  <SpreadSheetModal
    title={title}
    onClose={onClose}
    data={data as unknown as Record<string, unknown>}
    groupConfigs={SHOP_MODAL_GROUPS}
    fullWidthKeys={["住所"]}
  />
));
ShopModalContent.displayName = "ShopModalContent";
export default ShopModalContent;

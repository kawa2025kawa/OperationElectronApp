// electron/features/masterData/application/publicMasterDataMapper.ts

import type { SpreadsheetMasterDataResponse } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type PublicJugyoin,
  type PublicKokyuhyo,
  type PublicShop,
  type SheetId,
  type Shop,
  type ShopResourceKey,
  type Tantou,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { cleanDashCell } from "@shared/utils/sharedUtils";
import { getSpreadsheetMasterData } from "./spreadsheetMasterDataManager";

type StaffHiddenKey = "nameKana" | "scheduleLink";

const SHOP_RESOURCE_KEYS = [
  "tr1ImageUrl",
  "tr2ImageUrl",
  "tr3ImageUrl",
  "tr4ImageUrl",
  "hubImageUrl",
  "outletImageUrl",
  "excelFilePath",
  "pdfFilePath",
] as const satisfies readonly ShopResourceKey[];

const ALLOWED_SHOP_KEYS = [
  "shopCode",
  "shopName",
  "shopKana",
  "openTime",
  "closeTime",
  "centerName",
  "areaName",
  "phoneNumber",
  "postalCode",
  "address",
  "mobileSales",
  "storeManagerName",
  "assistantManagerName1",
  "assistantManagerName2",
  "areaManagerName",
  "deviceCount",
  "comment",
  "printerModelB",
  "printerSerialNumberB",
  "printerPhoneB",
  "printerHolidayPhoneB",
  "printerContractIdB",
  "printerModelK",
  "printerSerialNumberK",
  "printerPhoneK",
  "printerHolidayPhoneK",
  "printerContractIdK",
  "printerModelO",
  "printerSerialNumberO",
  "printerPhoneO",
  "printerHolidayPhoneO",
  "printerContractIdO",
  "tr1Name",
  "tr1Ip",
  "tr1Model",
  "tr1LogicalName",
  "tr1PhysicalName",
  "tr2Name",
  "tr2Ip",
  "tr2Model",
  "tr2LogicalName",
  "tr2PhysicalName",
  "tr3Name",
  "tr3Ip",
  "tr3Model",
  "tr3LogicalName",
  "tr3PhysicalName",
  "tr4Name",
  "tr4Ip",
  "tr4Model",
  "tr4LogicalName",
  "tr4PhysicalName",
] as const satisfies readonly (keyof Omit<Shop, ShopResourceKey>)[];

const ALLOWED_STAFF_KEYS = [
  "id",
  "name",
  "todayAmStatus",
  "todayAmDetail",
  "todayPmStatus",
  "todayPmDetail",
  "tomorrowAmStatus",
  "tomorrowAmDetail",
  "tomorrowPmStatus",
  "tomorrowPmDetail",
  "naisen",
  "tanshuku",
  "contactMobile",
  "position",
  "email",
] as const satisfies readonly (keyof Omit<Kokyuhyo, StaffHiddenKey>)[];

const ALLOWED_JUGYOIN_KEYS = [
  ...ALLOWED_STAFF_KEYS,
  "bumon",
] as const satisfies readonly (keyof Omit<
  Jugyoin,
  StaffHiddenKey | "bumonKana"
>)[];

const ALLOWED_TANTOU_KEYS = [
  "id",
  "todayHayaban",
  "todayShikai",
  "todayUketsuke",
  "todayDenwa",
  "todayNimotsu",
  "today2F",
  "today3F",
  "todayTensou",
  "todayAmAttendanceRate",
  "todayPmAttendanceRate",
  "tomorrowHayaban",
  "tomorrowShikai",
  "tomorrowUketsuke",
  "tomorrowDenwa",
  "tomorrowNimotsu",
  "tomorrow2F",
  "tomorrow3F",
  "tomorrowTensou",
  "tomorrowAmAttendanceRate",
  "tomorrowPmAttendanceRate",
] as const satisfies readonly (keyof Tantou)[];

function pickAllowedFields<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key] ?? ("" as T[K]);
  }
  return result;
}

function toPublicShop(shop: Shop): PublicShop {
  const availableResources: Partial<Record<ShopResourceKey, boolean>> = {};
  for (const key of SHOP_RESOURCE_KEYS) {
    if (cleanDashCell(shop[key])) {
      availableResources[key] = true;
    }
  }

  return {
    ...pickAllowedFields(shop, ALLOWED_SHOP_KEYS),
    availableResources,
  };
}

function toPublicKokyuhyo(row: Kokyuhyo): PublicKokyuhyo {
  return {
    ...pickAllowedFields(row, ALLOWED_STAFF_KEYS),
    hasScheduleLink: Boolean(cleanDashCell(row.scheduleLink)),
  };
}

function toPublicJugyoin(row: Jugyoin): PublicJugyoin {
  return {
    ...pickAllowedFields(row, ALLOWED_JUGYOIN_KEYS),
    hasScheduleLink: Boolean(cleanDashCell(row.scheduleLink)),
  };
}

// レンダラー公開用に機密パス等を除外したマスタデータを返す
export async function getPublicSpreadsheetMasterData(): Promise<SpreadsheetMasterDataResponse> {
  const masterData = await getSpreadsheetMasterData();
  return {
    stores: masterData.stores.map(toPublicShop),
    kokyuhyos: masterData.kokyuhyos.map(toPublicKokyuhyo),
    jugyoin: masterData.jugyoin.map(toPublicJugyoin),
    kokyuhyoTantous: masterData.kokyuhyoTantous.map((row) =>
      pickAllowedFields(row, ALLOWED_TANTOU_KEYS),
    ),
    operations: masterData.operations,
    irregulars: masterData.irregulars,
    todayIrregulars: masterData.todayIrregulars,
    dailyUpdateStatus: masterData.dailyUpdateStatus,
    errors: { ...masterData.errors },
  };
}

// 対象スタッフのスケジュールリンクを解決する
export async function resolveStaffScheduleLink(
  sheetId: SheetId,
  staffId: string,
): Promise<string> {
  const cleanId = staffId?.trim();
  if (!cleanId) {
    throw new Error("対象スタッフIDが指定されていません");
  }

  const masterData = await getSpreadsheetMasterData();
  const list =
    sheetId === SHEETS.JUGYOIN.sheetName
      ? masterData.jugyoin
      : masterData.kokyuhyos;
  const link = cleanDashCell(
    list.find((item) => item.id?.trim() === cleanId)?.scheduleLink,
  );

  if (!link) {
    throw new Error("スケジュールリンクが登録されていません");
  }

  return link;
}

// 対象店舗のリソースパスを解決する
export async function resolveShopResourcePath(
  shopCode: string,
  resourceKey: ShopResourceKey,
): Promise<string> {
  const cleanCode = shopCode?.trim();
  if (!cleanCode || !SHOP_RESOURCE_KEYS.includes(resourceKey)) {
    throw new Error("店舗リソースの指定が不正です");
  }

  const masterData = await getSpreadsheetMasterData();
  const resourcePath = cleanDashCell(
    masterData.stores.find((item) => item.shopCode?.trim() === cleanCode)?.[
      resourceKey
    ],
  );

  if (!resourcePath) {
    throw new Error("対象のファイルまたは画像が登録されていません");
  }

  return resourcePath;
}

// src/renderer/registry/appRegistry.ts

import {
  APP_VIEW_IDS,
  APP_VIEW_METADATA,
  type AppViewId,
  type AppViewDefinition,
  type ViewEntityMap,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";
import {
  SHEETS,
  SHOP_COLUMNS,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import { OperationView } from "@renderer/features/operation/OperationView";
import { OPERATION_TABLE_SEARCH_KEYS } from "@renderer/store/selectors/operationSelectors";
import {
  KokyuhyoView,
  JugyoinView,
  ShopView,
} from "@renderer/features/spreadSheet/SpreadSheetView";
import {
  KOKYUHYO_COLUMNS,
  JUGYOIN_COLUMNS,
} from "@renderer/features/spreadSheet/utils/spreadsheetDateUtils";
import { OtherView } from "@renderer/features/other/OtherView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import { AuthView } from "@renderer/features/auth/AuthView";

export { APP_VIEW_IDS, ViewMode, type AppViewId, type ViewEntityMap };

export type AppRegistryMap = {
  [K in AppViewId]: AppViewDefinition<ViewEntityMap[K]>;
};

function defineView<K extends AppViewId>(
  id: K,
  config: Omit<
    AppViewDefinition<ViewEntityMap[K]>,
    "id" | "title" | "isProtected" | "sidebarMenu"
  > & {
    title?: string;
    isProtected?: boolean;
    sidebarMenu?: AppViewDefinition["sidebarMenu"];
  },
): AppViewDefinition<ViewEntityMap[K]> {
  const meta = APP_VIEW_METADATA[id];
  return {
    ...config,
    id,
    title: config.title ?? meta.title,
    isProtected: config.isProtected ?? meta.isProtected,
    sidebarMenu: config.sidebarMenu ?? {
      show: true,
      order: meta.sidebarOrder,
    },
  } as AppViewDefinition<ViewEntityMap[K]>;
}

export const APP_REGISTRY: AppRegistryMap = {
  [APP_VIEW_IDS.OPERATION]: defineView(APP_VIEW_IDS.OPERATION, {
    component: OperationView,
    search: {
      placeholder: "検索...",
      searchKeys: OPERATION_TABLE_SEARCH_KEYS,
    },
  }),

  [APP_VIEW_IDS.KOKYUHYO]: defineView(APP_VIEW_IDS.KOKYUHYO, {
    component: KokyuhyoView,
    sheetId: SHEETS.KOKYUHYO.sheetName,
    search: {
      placeholder: "名前、名前カナで検索...",
      searchKeys: ["name", "nameKana"],
    },
    columns: KOKYUHYO_COLUMNS,
  }),

  [APP_VIEW_IDS.JUGYOIN]: defineView(APP_VIEW_IDS.JUGYOIN, {
    component: JugyoinView,
    sheetId: SHEETS.JUGYOIN.sheetName,
    search: {
      placeholder: "部門、名前で検索...",
      searchKeys: ["bumon", "bumonKana", "name", "nameKana"],
    },
    columns: JUGYOIN_COLUMNS,
  }),

  [APP_VIEW_IDS.SHOP]: defineView(APP_VIEW_IDS.SHOP, {
    component: ShopView,
    sheetId: SHEETS.STORE.sheetName,
    search: {
      placeholder: "店舗コード、店舗名、住所等で検索...",
      searchKeys: [
        "shopCode",
        "shopName",
        "shopKana",
        "address",
        "phoneNumber",
        "centerName",
      ],
    },
    columns: SHOP_COLUMNS,
  }),

  [APP_VIEW_IDS.OTHER]: defineView(APP_VIEW_IDS.OTHER, {
    component: OtherView,
  }),

  [APP_VIEW_IDS.RDP]: defineView(APP_VIEW_IDS.RDP, {
    component: RdpView,
  }),

  [APP_VIEW_IDS.AUTH]: defineView(APP_VIEW_IDS.AUTH, {
    component: AuthView,
  }),
};

export function getAppViewConfig<K extends AppViewId>(
  viewId: K,
): AppViewDefinition<ViewEntityMap[K]> {
  return (
    (APP_REGISTRY[viewId] as AppViewDefinition<ViewEntityMap[K]>) ??
    APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

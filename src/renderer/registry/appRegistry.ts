// src/renderer/registry/appRegistry.ts

import type { ComponentType } from "react";

import type { ViewMode } from "@shared/types/registry/viewDefinition";

import { AuthView } from "@renderer/features/auth/AuthView";
import { OperationView } from "@renderer/features/operation/OperationView";
import { OtherView } from "@renderer/features/other/OtherView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import {
  JugyoinView,
  KokyuhyoView,
  ShopView,
} from "@renderer/features/spreadSheet/SpreadSheetView";

export const VIEW_MODES = {
  OPERATION: "operation",
  IRREGULAR: "irregular",
  TODAY: "today",
} as const satisfies Record<string, ViewMode>;

export { type ViewMode };

export const APP_VIEW_IDS = {
  OPERATION: "operation",
  AUTH: "auth",
  RDP: "rdp",
  KOKYUHYO: "kokyuhyo",
  JUGYOIN: "jugyoin",
  SHOP: "shop",
  OTHER: "other",
} as const;

export type AppViewId = (typeof APP_VIEW_IDS)[keyof typeof APP_VIEW_IDS];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  [VIEW_MODES.OPERATION]: "Operation",
  [VIEW_MODES.IRREGULAR]: "Irregular",
  [VIEW_MODES.TODAY]: "Today",
} as const;

interface AppViewDefinition {
  readonly id: AppViewId;
  readonly title: string;
  readonly component: ComponentType;
  readonly sidebarOrder: number;
  readonly searchPlaceholder?: string;
}

export const APP_REGISTRY = {
  [APP_VIEW_IDS.OPERATION]: {
    id: APP_VIEW_IDS.OPERATION,
    title: "オペレーション",
    component: OperationView,
    sidebarOrder: 1,
    searchPlaceholder: "検索...",
  },
  [APP_VIEW_IDS.KOKYUHYO]: {
    id: APP_VIEW_IDS.KOKYUHYO,
    title: "公休表",
    component: KokyuhyoView,
    sidebarOrder: 2,
    searchPlaceholder: "名前、名前カナで検索...",
  },
  [APP_VIEW_IDS.JUGYOIN]: {
    id: APP_VIEW_IDS.JUGYOIN,
    title: "従業員情報",
    component: JugyoinView,
    sidebarOrder: 3,
    searchPlaceholder: "部門、名前で検索...",
  },
  [APP_VIEW_IDS.SHOP]: {
    id: APP_VIEW_IDS.SHOP,
    title: "店舗情報",
    component: ShopView,
    sidebarOrder: 4,
    searchPlaceholder: "店舗コード、店舗名、住所等で検索...",
  },
  [APP_VIEW_IDS.OTHER]: {
    id: APP_VIEW_IDS.OTHER,
    title: "その他",
    component: OtherView,
    sidebarOrder: 5,
  },
  [APP_VIEW_IDS.RDP]: {
    id: APP_VIEW_IDS.RDP,
    title: "RDP接続",
    component: RdpView,
    sidebarOrder: 6,
  },
  [APP_VIEW_IDS.AUTH]: {
    id: APP_VIEW_IDS.AUTH,
    title: "Account",
    component: AuthView,
    sidebarOrder: 7,
  },
} as const satisfies Record<AppViewId, AppViewDefinition>;

export const SIDEBAR_VIEW_ITEMS: readonly AppViewDefinition[] = Object.values(
  APP_REGISTRY,
).sort((a, b) => a.sidebarOrder - b.sidebarOrder);

export function getAppViewConfig(viewId: AppViewId): AppViewDefinition {
  return APP_REGISTRY[viewId] ?? APP_REGISTRY[APP_VIEW_IDS.OPERATION];
}

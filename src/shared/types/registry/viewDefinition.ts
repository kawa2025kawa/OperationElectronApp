// src/shared/types/registry/viewDefinition.ts

import type { ComponentType, ReactNode } from "react";

import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import type {
  Jugyoin,
  Kokyuhyo,
  Shop,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { ModalConfig } from "@shared/types/ui/modal";

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

/**
 * 画面 ID ごとのメタデータ定義（タイトル・表示順・保護状態の一元管理）
 */
export interface AppViewMetadata {
  readonly title: string;
  readonly sidebarOrder: number;
  readonly isProtected: boolean;
}

export const APP_VIEW_METADATA = {
  [APP_VIEW_IDS.OPERATION]: {
    title: "オペレーション",
    sidebarOrder: 1,
    isProtected: false,
  },
  [APP_VIEW_IDS.KOKYUHYO]: {
    title: "公休表",
    sidebarOrder: 2,
    isProtected: true,
  },
  [APP_VIEW_IDS.JUGYOIN]: {
    title: "従業員情報",
    sidebarOrder: 3,
    isProtected: true,
  },
  [APP_VIEW_IDS.SHOP]: {
    title: "店舗情報",
    sidebarOrder: 4,
    isProtected: true,
  },
  [APP_VIEW_IDS.OTHER]: {
    title: "その他",
    sidebarOrder: 5,
    isProtected: false,
  },
  [APP_VIEW_IDS.RDP]: {
    title: "RDP接続",
    sidebarOrder: 6,
    isProtected: false,
  },
  [APP_VIEW_IDS.AUTH]: {
    title: "Account",
    sidebarOrder: 7,
    isProtected: false,
  },
} as const satisfies Record<AppViewId, AppViewMetadata>;

/**
 * 画面 ID ごとのエンティティ型のマッピング（一元管理定義）
 */
export type ViewEntityMap = {
  [APP_VIEW_IDS.OPERATION]: OperationViewItem;
  [APP_VIEW_IDS.KOKYUHYO]: Kokyuhyo;
  [APP_VIEW_IDS.JUGYOIN]: Jugyoin;
  [APP_VIEW_IDS.SHOP]: Shop;
  [APP_VIEW_IDS.OTHER]: void;
  [APP_VIEW_IDS.RDP]: void;
  [APP_VIEW_IDS.AUTH]: void;
};

export const VIEW_MODES = {
  OPERATION: "operation",
  IRREGULAR: "irregular",
  TODAY: "today",
} as const;

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

interface ActionStoreContext {
  openGlobalModal: (content: ReactNode, config?: ModalConfig) => void;
  closeGlobalModal: () => void;
}

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  [VIEW_MODES.OPERATION]: "Operation",
  [VIEW_MODES.IRREGULAR]: "Irregular",
  [VIEW_MODES.TODAY]: "Today",
} as const;

type ViewActionType = "modal" | "external" | "custom";

interface ViewActionDefinition<TItem = unknown> {
  readonly key: string;
  readonly label: string;
  readonly type: ViewActionType;
  readonly modalType?: string;
  readonly isActive: (item: TItem) => boolean;
  readonly execute: (
    item: TItem,
    store: ActionStoreContext,
  ) => Promise<void> | void;
}

export interface AppViewDefinition<TItem = unknown> {
  readonly id: AppViewId;
  readonly title: string;
  readonly component?: ComponentType<Record<string, unknown>> | null;
  readonly isProtected?: boolean;
  readonly sidebarMenu?: {
    readonly show: boolean;
    readonly order: number;
  };
  readonly sheetId?: string;
  readonly search?: {
    readonly placeholder: string;
    readonly searchKeys: readonly string[];
    readonly skipFilter?: boolean;
  };
  readonly actions?: readonly ViewActionDefinition<TItem>[];
}

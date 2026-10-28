// src/shared/types/registry/viewDefinition.ts

import type { ComponentType, ReactNode } from "react";

import type { Column } from "@shared/types/table/tableType";
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

export const VIEW_MODES = {
  OPERATION: "operation",
  IRREGULAR: "irregular",
  TODAY: "today",
} as const;

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

export interface ActionStoreContext {
  openGlobalModal: (content: ReactNode, config?: ModalConfig) => void;
  closeGlobalModal: () => void;
}

export const VIEW_ACTION_TYPES = {
  MODAL: "modal",
  EXTERNAL: "external",
  CUSTOM: "custom",
} as const;

export type ViewActionType =
  (typeof VIEW_ACTION_TYPES)[keyof typeof VIEW_ACTION_TYPES];

export interface ViewActionDefinition<TItem = unknown> {
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
  readonly columns?: readonly Column<TItem>[];
  readonly actions?: readonly ViewActionDefinition<TItem>[];
}

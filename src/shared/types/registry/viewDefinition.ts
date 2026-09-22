// src/shared/types/registry/viewDefinition.ts

import type { ComponentType, ReactNode } from "react";
import type { Column } from "@shared/types/table/tableType";
import type { ModalConfig, ModalSize } from "@shared/types/ui/modal";

/* ============================================================================
 * View & Mode Constants & Types
 * ========================================================================== */

export const APP_VIEW_IDS = {
  OPERATION: "operation",
  AUTH: "auth",
  RDP: "rdp",
  KOKYUHYO: "kokyuhyo",
  JUGYOIN: "jugyoin",
  SHOP: "shop",
  TANTOU: "tantou",
  OTHER: "other",
} as const;

export type AppViewId = (typeof APP_VIEW_IDS)[keyof typeof APP_VIEW_IDS];

export const VIEW_MODES = ["operation", "irregular", "today"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/* ============================================================================
 * Action & Definition Interfaces
 * ========================================================================== */

export interface ActionStoreContext {
  openGlobalModal: (content: ReactNode, config?: ModalConfig) => void;
  closeGlobalModal: () => void;
}

export interface ViewActionDefinition<TItem = unknown> {
  key: string;
  label: string;
  type: "modal" | "external" | "custom";
  modalType?: string;
  modalSize?: ModalSize;
  isActive: (item: TItem) => boolean;
  execute: (item: TItem, store: ActionStoreContext) => Promise<void> | void;
}

export interface AppViewDefinition<TItem = unknown> {
  id: AppViewId;
  title: string;
  component?: ComponentType<Record<string, unknown>> | null;
  isProtected?: boolean;
  sidebarMenu?: {
    show: boolean;
    order: number;
  };
  sheetId?: string;
  search?: {
    placeholder: string;
    searchKeys: readonly string[];
    skipFilter?: boolean;
  };
  modalConfig?: {
    modalType: string;
    modalSize: ModalSize;
    component?: ComponentType<Record<string, unknown>>;
  };
  columns?: readonly Column<TItem>[];
  actions?: readonly ViewActionDefinition<TItem>[];
}

// src/shared/types/appRegistryType.ts
import type { ComponentType, ReactNode } from "react";
import type { SheetId } from "@shared/types/spreadsheetTypes";
import type { Column } from "@shared/types/tableType";
import type { AppViewId, GlobalModalConfig } from "@shared/types/uiType";

export type ModalSize = {
  width: string;
  height: string;
};

export interface ActionStoreContext {
  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

export interface ViewActionDefinition<TItem = any> {
  key: string;
  label: string;
  type: "modal" | "external" | "custom";
  modalType?: string;
  modalSize?: ModalSize;
  isActive: (item: TItem) => boolean;
  execute: (item: TItem, store: ActionStoreContext) => Promise<void> | void;
}

export interface AppViewDefinition {
  id: AppViewId;
  title: string;
  component?: ComponentType<any> | null;
  isProtected?: boolean;
  sidebarMenu?: {
    show: boolean;
    order: number;
  };
  sheetId?: SheetId;
  search?: {
    placeholder: string;
    searchKeys: readonly string[];
    skipFilter?: boolean;
  };
  modalConfig?: {
    modalType: string;
    modalSize: ModalSize;
    component?: ComponentType<any>;
  };
  columns?: readonly Column<unknown>[];
  actions?: readonly ViewActionDefinition[];
}

export interface ExtraModalDefinition {
  modalType: string;
  modalSize: ModalSize;
  component?: ComponentType<any>;
  columns?: readonly Column<unknown>[];
  execute?: (store: ActionStoreContext) => void;
}

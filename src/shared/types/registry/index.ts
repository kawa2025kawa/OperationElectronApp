import type { ComponentType, ReactNode } from "react";
import type { SheetId } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import type { AppViewId, GlobalModalConfig } from "@shared/types/ui";

export type ModalSize = {
  width: string;
  height: string;
};

export interface ActionStoreContext {
  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
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
  sheetId?: SheetId;
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

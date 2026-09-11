import type { ComponentType, ReactNode } from "react";
import type { Column } from "@shared/types/table/tableType";
import type { AppViewId, ModalConfig, ModalSize } from "@shared/types/ui";

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

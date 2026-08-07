// src/renderer/registry/appRegistry.ts
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import {
  jugyoinViewConfig,
  kokyuhyoViewConfig,
  shopViewConfig,
  tantouViewConfig,
} from "@renderer/features/spreadSheet/config/spreadsheetViewConfigs";
import type {
  AppViewDefinition,
  ExtraModalDefinition,
} from "@shared/types/appRegistryType";
import {
  APP_VIEW_IDS,
  EXTRA_MODAL_TYPES,
  type AppViewId,
} from "@shared/types/uiType";

export type * from "@shared/types/appRegistryType";

export const APP_REGISTRY: Record<AppViewId, AppViewDefinition> = {
  [APP_VIEW_IDS.OPERATION]: operationViewConfig,
  [APP_VIEW_IDS.KOKYUHYO]: kokyuhyoViewConfig,
  [APP_VIEW_IDS.JUGYOIN]: jugyoinViewConfig,
  [APP_VIEW_IDS.SHOP]: shopViewConfig,
  [APP_VIEW_IDS.TANTOU]: tantouViewConfig,
  [APP_VIEW_IDS.RDP]: {
    id: APP_VIEW_IDS.RDP,
    title: "RDP",
    isProtected: false,
    sidebarMenu: { show: true, order: 5 },
  },
  [APP_VIEW_IDS.AUTH]: {
    id: APP_VIEW_IDS.AUTH,
    title: "Account",
    isProtected: false,
    sidebarMenu: { show: true, order: 6 },
  },
};

export const EXTRA_MODAL_REGISTRY: Record<string, ExtraModalDefinition> = {
  [EXTRA_MODAL_TYPES.PDF_UPLOAD]: {
    modalType: EXTRA_MODAL_TYPES.PDF_UPLOAD,
    modalSize: { width: "min(75vw, 850px)", height: "min(75vh, 650px)" },
    execute: () => {
      console.warn("PDF_UPLOAD modal execute hook called");
    },
  },
};

export function getAppViewConfig(viewId: string): AppViewDefinition {
  return (
    APP_REGISTRY[viewId as AppViewId] ?? APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

export function isProtectedView(viewId: string): boolean {
  const config = APP_REGISTRY[viewId as AppViewId];
  return config?.isProtected ?? false;
}

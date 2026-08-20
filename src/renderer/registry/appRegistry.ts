// src/renderer/registry/appRegistry.ts
import React from "react";
import { useAppStore } from "@shared/store";
import {
  APP_VIEW_IDS,
  EXTRA_MODAL_TYPES,
  type AppViewId,
} from "@shared/types/uiType";
import type {
  AppViewDefinition,
  ExtraModalDefinition,
} from "@shared/types/appRegistryType";

// --- Views ---
import OperationView from "@renderer/features/operation/OperationView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import AuthView from "@renderer/features/auth/AuthView";
import SpreadSheetView from "@renderer/features/spreadSheet/SpreadSheetView";
import OtherView from "@renderer/features/other/OtherView";

// --- Configs & Modals ---
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import {
  jugyoinViewConfig,
  kokyuhyoViewConfig,
  shopViewConfig,
  tantouViewConfig,
} from "@renderer/features/spreadSheet/config/spreadsheetViewConfigs";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

export type * from "@shared/types/appRegistryType";

/* ============================================================================
 * 1. App View Registry
 * ============================================================================ */
export const APP_REGISTRY: Record<AppViewId, AppViewDefinition> = {
  [APP_VIEW_IDS.OPERATION]: operationViewConfig,
  [APP_VIEW_IDS.KOKYUHYO]: kokyuhyoViewConfig,
  [APP_VIEW_IDS.JUGYOIN]: jugyoinViewConfig,
  [APP_VIEW_IDS.SHOP]: shopViewConfig,
  [APP_VIEW_IDS.TANTOU]: tantouViewConfig,
  [APP_VIEW_IDS.OTHER]: {
    id: APP_VIEW_IDS.OTHER,
    title: "Other",
    isProtected: false,
    sidebarMenu: { show: true, order: 5 },
  },
  [APP_VIEW_IDS.RDP]: {
    id: APP_VIEW_IDS.RDP,
    title: "RDP",
    isProtected: false,
    sidebarMenu: { show: true, order: 6 },
  },
  [APP_VIEW_IDS.AUTH]: {
    id: APP_VIEW_IDS.AUTH,
    title: "Account",
    isProtected: false,
    sidebarMenu: { show: true, order: 7 },
  },
};

/* ============================================================================
 * 2. Component Mapping
 * ============================================================================ */
const COMPONENT_MAP = {
  [APP_VIEW_IDS.OPERATION]: OperationView,
  [APP_VIEW_IDS.RDP]: RdpView,
  [APP_VIEW_IDS.OTHER]: OtherView,
  [APP_VIEW_IDS.AUTH]: AuthView,
  [APP_VIEW_IDS.KOKYUHYO]: SpreadSheetView,
  [APP_VIEW_IDS.JUGYOIN]: SpreadSheetView,
  [APP_VIEW_IDS.SHOP]: SpreadSheetView,
  [APP_VIEW_IDS.TANTOU]: SpreadSheetView,
} as const;

/* ============================================================================
 * 3. Extra Modal Registry
 * ============================================================================ */
export const EXTRA_MODAL_REGISTRY: Record<string, ExtraModalDefinition> = {
  [EXTRA_MODAL_TYPES.PDF_UPLOAD]: {
    modalType: EXTRA_MODAL_TYPES.PDF_UPLOAD,
    modalSize: { width: "min(75vw, 850px)", height: "min(75vh, 650px)" },
    execute: (store) =>
      store.openGlobalModal(
        React.createElement(OperationModal, {
          type: "pdfUpload",
          onClose: store.closeGlobalModal,
        }),
        {
          title: "店舗matic",
          width: "min(75vw, 850px)",
          height: "min(75vh, 650px)",
        },
      ),
  },
};

/* ============================================================================
 * 4. Setup Method
 * ============================================================================ */
interface CustomGlobal {
  useAppStore?: typeof useAppStore;
}

export const setupAppRegistry = (): void => {
  // 1. Component バインド
  Object.entries(COMPONENT_MAP).forEach(([viewId, component]) => {
    const registryItem = APP_REGISTRY[viewId as keyof typeof COMPONENT_MAP];
    if (registryItem) {
      registryItem.component = component;
    }
  });

  // 2. Zustand Store のグローバル参照を確保
  if (typeof window !== "undefined") {
    (globalThis as unknown as CustomGlobal).useAppStore = useAppStore;
  }
};

/* ============================================================================
 * 5. Helper Methods
 * ============================================================================ */
export function getAppViewConfig(viewId: string): AppViewDefinition {
  return (
    APP_REGISTRY[viewId as AppViewId] ?? APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

export function isProtectedView(viewId: string): boolean {
  const config = APP_REGISTRY[viewId as AppViewId];
  return config?.isProtected ?? false;
}

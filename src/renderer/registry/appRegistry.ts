// src/renderer/registry/appRegistry.ts

import type React from "react";
import { useAppStore } from "@shared/store";
import { APP_VIEW_IDS, type AppViewId } from "@shared/types/uiType";
import type { AppViewDefinition } from "@shared/types/appRegistryType";

// --- Configs ---
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import { shopViewConfig } from "@renderer/features/spreadSheet/components/modal/shop/useShopModalContent";
import { tantouViewConfig } from "@renderer/features/spreadSheet/components/modal/tantou/useTantouModalContent";
import { jugyoinViewConfig } from "@renderer/features/spreadSheet/components/modal/jugyoin/useJugyoinModalContent";
import { kokyuhyoViewConfig } from "@renderer/features/spreadSheet/components/modal/kokyuhyo/useKokyuhyoModalContent";

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
 * 2. Setup Method
 * ============================================================================ */
interface CustomGlobal {
  useAppStore?: typeof useAppStore;
}

export const setupAppRegistry = (
  componentMap?: Partial<Record<AppViewId, React.ComponentType<never>>>,
): void => {
  if (componentMap) {
    Object.entries(componentMap).forEach(([viewId, component]) => {
      const registryItem = APP_REGISTRY[viewId as AppViewId];
      if (registryItem && component) {
        registryItem.component = component as React.ComponentType;
      }
    });
  }

  if (typeof window !== "undefined") {
    (globalThis as unknown as CustomGlobal).useAppStore = useAppStore;
  }
};

/* ============================================================================
 * 3. Helper Methods
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

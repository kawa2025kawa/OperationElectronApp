import type React from "react";
import { APP_VIEW_IDS, type AppViewId } from "@shared/types/ui";
import type { AppViewDefinition } from "@shared/types/registry";
import type { OperationItem } from "@shared/types/operation";
import type {
  Jugyoin,
  Kokyuhyo,
  Shop,
  Tantou,
} from "@shared/types/spreadsheet";

// Configs
import { operationViewConfig } from "@renderer/features/operation/configs/operationViewConfig";
import { kokyuhyoViewConfig } from "@renderer/features/spreadSheet/configs/kokyuhyoViewConfig";
import { jugyoinViewConfig } from "@renderer/features/spreadSheet/configs/jugyoinViewConfig";
import { shopViewConfig } from "@renderer/features/spreadSheet/configs/shopViewConfig";
import { tantouViewConfig } from "@renderer/features/spreadSheet/configs/tantouViewConfig";
import { otherViewConfig } from "@renderer/features/other/configs/otherViewConfig";
import { rdpViewConfig } from "@renderer/features/remoteDesktop/configs/rdpViewConfig";
import { authViewConfig } from "@renderer/features/auth/configs/authViewConfig";

/**
 * 各 AppViewId と対になるデータエンティティ型の厳密なマップ
 */
export type ViewEntityMap = {
  [APP_VIEW_IDS.OPERATION]: OperationItem;
  [APP_VIEW_IDS.KOKYUHYO]: Kokyuhyo;
  [APP_VIEW_IDS.JUGYOIN]: Jugyoin;
  [APP_VIEW_IDS.SHOP]: Shop;
  [APP_VIEW_IDS.TANTOU]: Tantou;
  [APP_VIEW_IDS.OTHER]: void;
  [APP_VIEW_IDS.RDP]: void;
  [APP_VIEW_IDS.AUTH]: void;
};

/**
 * レジストリ全体の厳密型定義
 */
export type AppRegistryMap = {
  [K in AppViewId]: AppViewDefinition<ViewEntityMap[K]>;
};

export const APP_REGISTRY: AppRegistryMap = {
  [APP_VIEW_IDS.OPERATION]: operationViewConfig,
  [APP_VIEW_IDS.KOKYUHYO]: kokyuhyoViewConfig,
  [APP_VIEW_IDS.JUGYOIN]: jugyoinViewConfig,
  [APP_VIEW_IDS.SHOP]: shopViewConfig,
  [APP_VIEW_IDS.TANTOU]: tantouViewConfig,
  [APP_VIEW_IDS.OTHER]: otherViewConfig,
  [APP_VIEW_IDS.RDP]: rdpViewConfig,
  [APP_VIEW_IDS.AUTH]: authViewConfig,
};

export const setupAppRegistry = (
  componentMap?: Partial<Record<AppViewId, React.ComponentType<never>>>,
): void => {
  if (!componentMap) return;
  for (const [viewId, component] of Object.entries(componentMap)) {
    const registryItem = APP_REGISTRY[viewId as AppViewId];
    if (registryItem && component) {
      registryItem.component = component as React.ComponentType;
    }
  }
};

export function getAppViewConfig<K extends AppViewId>(
  viewId: K,
): AppViewDefinition<ViewEntityMap[K]> {
  return (
    (APP_REGISTRY[viewId] as AppViewDefinition<ViewEntityMap[K]>) ??
    APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

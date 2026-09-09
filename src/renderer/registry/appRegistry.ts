// src/renderer/registry/appRegistry.ts

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

// Views (直接参照をこちらに集約)
import { OperationView } from "@renderer/features/operation/OperationView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import { OtherView } from "@renderer/features/other/OtherView";
import { AuthView } from "@renderer/features/auth/AuthView";
import { SpreadSheetView } from "@renderer/features/spreadSheet/SpreadSheetView";

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

export type AppRegistryMap = {
  [K in AppViewId]: AppViewDefinition<ViewEntityMap[K]>;
};

export const APP_REGISTRY: AppRegistryMap = {
  [APP_VIEW_IDS.OPERATION]: {
    ...operationViewConfig,
    component: OperationView as React.ComponentType,
  },
  [APP_VIEW_IDS.KOKYUHYO]: {
    ...kokyuhyoViewConfig,
    component: SpreadSheetView as React.ComponentType,
  },
  [APP_VIEW_IDS.JUGYOIN]: {
    ...jugyoinViewConfig,
    component: SpreadSheetView as React.ComponentType,
  },
  [APP_VIEW_IDS.SHOP]: {
    ...shopViewConfig,
    component: SpreadSheetView as React.ComponentType,
  },
  [APP_VIEW_IDS.TANTOU]: {
    ...tantouViewConfig,
    component: SpreadSheetView as React.ComponentType,
  },
  [APP_VIEW_IDS.OTHER]: {
    ...otherViewConfig,
    component: OtherView as React.ComponentType,
  },
  [APP_VIEW_IDS.RDP]: {
    ...rdpViewConfig,
    component: RdpView as React.ComponentType,
  },
  [APP_VIEW_IDS.AUTH]: {
    ...authViewConfig,
    component: AuthView as React.ComponentType,
  },
};

export function getAppViewConfig<K extends AppViewId>(
  viewId: K,
): AppViewDefinition<ViewEntityMap[K]> {
  return (
    (APP_REGISTRY[viewId] as AppViewDefinition<ViewEntityMap[K]>) ??
    APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

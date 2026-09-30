// src/renderer/registry/appRegistry.ts

import type { ComponentType } from "react";
import type { MasterRow } from "@renderer/features/operation/helpers/entityUtils";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import {
  APP_VIEW_IDS,
  type AppViewId,
  type AppViewDefinition,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";

// Integrated Views & Configs (Configが統合されたView)
import { kokyuhyoViewConfig } from "@renderer/features/spreadSheet/kokyuhyo/KokyuhyoView";
import { jugyoinViewConfig } from "@renderer/features/spreadSheet/jugyoin/JugyoinView";
import { shopViewConfig } from "@renderer/features/spreadSheet/shop/ShopView";
import { tantouViewConfig } from "@renderer/features/spreadSheet/tantou/TantouView";

// Configs (独立Config)
import { operationViewConfig } from "@renderer/features/operation/configs/operationViewConfig";
import { otherViewConfig } from "@renderer/features/other/configs/otherViewConfig";
import { rdpViewConfig } from "@renderer/features/remoteDesktop/configs/rdpViewConfig";
import { authViewConfig } from "@renderer/features/auth/configs/authViewConfig";

// Views (独立View)
import { OperationView } from "@renderer/features/operation/OperationView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import { OtherView } from "@renderer/features/other/OtherView";
import { AuthView } from "@renderer/features/auth/AuthView";

export { APP_VIEW_IDS, type AppViewId, type ViewMode };

export type ViewEntityMap = {
  [APP_VIEW_IDS.OPERATION]: MasterRow;
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
    component: OperationView as ComponentType,
  },
  [APP_VIEW_IDS.KOKYUHYO]: kokyuhyoViewConfig,
  [APP_VIEW_IDS.JUGYOIN]: jugyoinViewConfig,
  [APP_VIEW_IDS.SHOP]: shopViewConfig,
  [APP_VIEW_IDS.TANTOU]: tantouViewConfig,
  [APP_VIEW_IDS.OTHER]: {
    ...otherViewConfig,
    component: OtherView as ComponentType,
  },
  [APP_VIEW_IDS.RDP]: {
    ...rdpViewConfig,
    component: RdpView as ComponentType,
  },
  [APP_VIEW_IDS.AUTH]: {
    ...authViewConfig,
    component: AuthView as ComponentType,
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

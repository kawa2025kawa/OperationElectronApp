// src/renderer/registry/appRegistry.ts

import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Shop } from "@shared/types/spreadsheet/shop";
import {
  APP_VIEW_IDS,
  type AppViewId,
  type AppViewDefinition,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";

export { APP_VIEW_IDS, ViewMode, type AppViewId };

export type ViewEntityMap = {
  [APP_VIEW_IDS.OPERATION]: OperationViewItem;
  [APP_VIEW_IDS.KOKYUHYO]: Kokyuhyo;
  [APP_VIEW_IDS.JUGYOIN]: Jugyoin;
  [APP_VIEW_IDS.SHOP]: Shop;
  [APP_VIEW_IDS.OTHER]: void;
  [APP_VIEW_IDS.RDP]: void;
  [APP_VIEW_IDS.AUTH]: void;
};

export type AppRegistryMap = {
  [K in AppViewId]: AppViewDefinition<ViewEntityMap[K]>;
};

type ViewConfigModule = Record<string, unknown>;

function isViewDefinition(value: unknown): value is AppViewDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "title" in value &&
    typeof value.id === "string" &&
    typeof value.title === "string"
  );
}

const viewConfigModules = import.meta.glob<ViewConfigModule>(
  "../features/**/*ViewConfig.ts",
  { eager: true },
);

const viewDefinitions = Object.values(viewConfigModules)
  .flatMap((module) => Object.values(module))
  .filter(isViewDefinition);

const registryEntries = viewDefinitions.map(
  (definition) => [definition.id, definition] as const,
);

const registry = Object.fromEntries(registryEntries) as AppRegistryMap;

const missingViewIds = Object.values(APP_VIEW_IDS).filter(
  (id) => !registry[id as AppViewId],
);

if (missingViewIds.length > 0) {
  throw new Error(`画面設定が見つかりません: ${missingViewIds.join(", ")}`);
}

const duplicateViewIds = registryEntries
  .map(([id]) => id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateViewIds.length > 0) {
  throw new Error(
    `画面 ID が重複しています: ${[...new Set(duplicateViewIds)].join(", ")}`,
  );
}

export const APP_REGISTRY: AppRegistryMap = registry;

export function getAppViewConfig<K extends AppViewId>(
  viewId: K,
): AppViewDefinition<ViewEntityMap[K]> {
  return (
    (APP_REGISTRY[viewId] as AppViewDefinition<ViewEntityMap[K]>) ??
    APP_REGISTRY[APP_VIEW_IDS.OPERATION]
  );
}

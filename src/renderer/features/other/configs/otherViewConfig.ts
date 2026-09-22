//src\renderer\features\other\configs\otherViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

export const otherViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OTHER,
  title: "その他",
  isProtected: false,
  sidebarMenu: { show: true, order: 5 },
};

// src/renderer/features/other/configs/otherViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { OtherView } from "@renderer/features/other/OtherView";

export const otherViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OTHER,
  title: "その他",
  component: OtherView,
  isProtected: false,
  sidebarMenu: { show: true, order: 5 },
};

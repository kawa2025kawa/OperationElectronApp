// src/renderer/features/auth/configs/authViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

export const authViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.AUTH,
  title: "Account",
  isProtected: false,
  sidebarMenu: { show: true, order: 7 },
};

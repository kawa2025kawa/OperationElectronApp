import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

export const rdpViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.RDP,
  title: "RDP接続",
  isProtected: false,
  sidebarMenu: { show: true, order: 6 },
};

import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const rdpViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.RDP,
  title: "RDP接続",
  isProtected: false,
  sidebarMenu: { show: true, order: 6 },
};

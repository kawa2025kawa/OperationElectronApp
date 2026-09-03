import type { AppViewDefinition } from "@shared/types/registry";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const authViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.AUTH,
  title: "Account",
  isProtected: false,
  sidebarMenu: { show: true, order: 7 },
};

import type { AppViewDefinition } from "@shared/types/registry";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const otherViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OTHER,
  title: "その他",
  isProtected: false,
  sidebarMenu: { show: true, order: 5 },
};

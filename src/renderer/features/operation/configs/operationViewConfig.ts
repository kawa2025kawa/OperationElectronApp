import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const operationViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OPERATION,
  title: "オペレーション",
  isProtected: false,
  sidebarMenu: { show: true, order: 1 },
  search: {
    placeholder: "検索...",
    searchKeys: ["kanriNo", "workName", "jobId"],
  },
};

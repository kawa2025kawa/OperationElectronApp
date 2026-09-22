// src/renderer/features/operation/configs/operationViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

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

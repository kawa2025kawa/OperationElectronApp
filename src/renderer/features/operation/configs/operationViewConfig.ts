// src/renderer/features/operation/configs/operationViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { OperationView } from "@renderer/features/operation/OperationView";

export const operationViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OPERATION,
  title: "オペレーション",
  component: OperationView,
  isProtected: false,
  sidebarMenu: { show: true, order: 1 },
  search: {
    placeholder: "検索...",
    searchKeys: ["kanriNo", "workName", "jobId"],
  },
};

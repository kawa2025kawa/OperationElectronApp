// src/renderer/features/remoteDesktop/configs/rdpViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";

export const rdpViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.RDP,
  title: "RDP接続",
  component: RdpView,
  isProtected: false,
  sidebarMenu: { show: true, order: 6 },
};

// src/renderer/features/operation/config/operationView.ts
import React from "react";
import type {
  AppViewDefinition,
  ViewActionDefinition,
} from "@shared/types/appRegistryType";
import { APP_VIEW_IDS, type OperationModalType } from "@shared/types/uiType";
import type { OperationItem } from "@shared/types/operationType";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

const createOperationAction = (
  type: OperationModalType,
  label: string,
  isActive: (item: OperationItem) => boolean,
  modalSize = { width: "min(80vw, 800px)", height: "min(70vh, 550px)" },
): ViewActionDefinition => ({
  key: type,
  label,
  type: "modal",
  modalType: type,
  modalSize,
  isActive: (item) => Boolean(item && isActive(item)),
  execute: (_item, store) => {
    store.openGlobalModal(
      React.createElement(OperationModal, {
        type: type,
        onClose: store.closeGlobalModal,
      }),
      {
        title: label,
        ...modalSize,
      },
    );
  },
});

export const operationViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.OPERATION,
  title: "Operation",
  isProtected: false,
  sidebarMenu: { show: true, order: 1 },
  search: {
    placeholder: "管理番号、名称、JobIDで検索...",
    searchKeys: ["workName", "jobId", "kanriNo"],
  },
  actions: [
    createOperationAction(
      "jc",
      "JC状態",
      (item) => Boolean(item.jobId && item.jobId !== "-"),
      {
        width: "min(80vw, 950px)",
        height: "min(70vh, 550px)",
      },
    ),
    createOperationAction("link", "リンク", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),
    createOperationAction("url", "URL", (item) =>
      Boolean(item.url && Object.keys(item.url).length > 0),
    ),
    createOperationAction("manual", "手順書", (item) => Boolean(item.manual), {
      width: "min(80vw, 800px)",
      height: "min(75vh, 600px)",
    }),
    createOperationAction(
      "script",
      "スクリプト",
      (item) => item.script === true,
    ),
  ],
};

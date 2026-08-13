// src/renderer/features/operation/config/operationView.ts

import React from "react";
import type {
  AppViewDefinition,
  ViewActionDefinition,
} from "@shared/types/appRegistryType";
import { APP_VIEW_IDS, type OperationModalType } from "@shared/types/uiType";
import type { OperationItem } from "@shared/types/operationType";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

const createOperationAction = (
  type: OperationModalType,
  label: string,
  isActive: (item: OperationItem) => boolean,
  modalSize = DEFAULT_MODAL_SIZE,
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
        type,
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

  sidebarMenu: {
    show: true,
    order: 1,
  },

  search: {
    placeholder: "管理番号、名称、JobIDで検索...",
    searchKeys: ["workName", "jobId", "kanriNo"],
  },

  actions: [
    createOperationAction(
      "jc",
      "JC",
      (item) => Boolean(item.jobId && item.jobId !== "-"),
      {
        width: "min(80vw, 950px)",
        height: "min(70vh, 550px)",
      },
    ),

    createOperationAction("link", "Link", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),

    createOperationAction("url", "URL", (item) =>
      Boolean(item.url && Object.keys(item.url).length > 0),
    ),

    createOperationAction("manual", "Manual", (item) => Boolean(item.kanriNo), {
      width: "min(80vw, 800px)",
      height: "min(75vh, 600px)",
    }),

    createOperationAction("script", "script", (item) => item.script === true),
  ],
};

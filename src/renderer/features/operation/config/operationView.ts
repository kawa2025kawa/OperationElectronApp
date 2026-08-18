// src/renderer/features/operation/config/operationView.ts

import React from "react";
import type {
  AppViewDefinition,
  ViewActionDefinition,
} from "@shared/types/appRegistryType";
import { APP_VIEW_IDS, type ExtraModalType } from "@shared/types/uiType";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import type { OperationItem } from "@shared/types/operationType";

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

const createOperationAction = (
  type: ExtraModalType,
  label: string,
  isActive: (item: OperationItem) => boolean,
  modalSize = DEFAULT_MODAL_SIZE,
): ViewActionDefinition => ({
  key: type,
  label,
  type: "modal",
  modalType: type,
  modalSize,

  isActive: (item) => Boolean(item && isActive(item as OperationItem)),

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
      (item) => Boolean("jobId" in item && item.jobId && item.jobId !== "-"),
      {
        width: "min(80vw, 950px)",
        height: "min(70vh, 550px)",
      },
    ),

    createOperationAction("link", "Link", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),

    createOperationAction("manual", "Manual", (item) => Boolean(item.kanriNo), {
      width: "min(80vw, 800px)",
      height: "min(75vh, 600px)",
    }),

    // 🎯 店舗maticアップロードのアクション登録
    createOperationAction(
      "pdfUpload",
      "店舗maticアップロード",
      (item) =>
        Boolean(
          item.kanriNo &&
          ["30", "37", "45", "54"].includes(String(item.kanriNo).trim()),
        ),
      {
        width: "min(80vw, 850px)",
        height: "min(75vh, 650px)",
      },
    ),

    createOperationAction("script", "script", (item) => item.script === true),
  ],
};

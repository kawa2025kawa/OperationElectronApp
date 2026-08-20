// src/renderer/features/operation/config/operationView.ts

import React from "react";
import type {
  AppViewDefinition,
  ViewActionDefinition,
} from "@shared/types/appRegistryType";
import { APP_VIEW_IDS, type ExtraModalType } from "@shared/types/uiType";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import type { OperationItem } from "@shared/types/operationType";
import { useAppStore } from "@shared/store";

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

/**
 * モーダルを表示するアクション用ヘルパー
 */
const createModalAction = (
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
    // 1. JC: モーダルなしで直接実行 (runJcJob を呼び出し)
    {
      key: "jc",
      label: "JC",
      type: "custom",
      isActive: (item) => {
        const opItem = item as OperationItem;
        return Boolean(
          "jobId" in opItem && opItem.jobId && opItem.jobId !== "-",
        );
      },
      execute: async (item) => {
        const opItem = item as OperationItem;
        if (!opItem?.kanriNo) return;
        const appState = useAppStore.getState();
        await appState.runJcJob(String(opItem.kanriNo));
      },
    },

    // 2. Script: モーダルなしで直接実行 (runScriptJob を呼び出し)[cite: 1]
    {
      key: "script",
      label: "script",
      type: "custom",
      isActive: (item) => (item as OperationItem)?.script === true,
      execute: async (item) => {
        const opItem = item as OperationItem;
        if (!opItem?.kanriNo) return;
        const appState = useAppStore.getState();
        await appState.runScriptJob(String(opItem.kanriNo));
      },
    },

    // 3. Gmail (gmail === true の時にアクティブ化)[cite: 1]
    createModalAction(
      "gmail",
      "Gmail",
      (item) => {
        const opItem = item as OperationItem;
        return "gmail" in opItem && opItem.gmail === true;
      },
      {
        width: "min(85vw, 700px)",
        height: "min(80vh, 600px)",
      },
    ),

    // 4. Link (モーダル表示)[cite: 1]
    createModalAction("link", "Link", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),
  ],
};

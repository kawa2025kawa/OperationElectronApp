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
import { commands } from "@shared/api/commands";

// ============================================================
// Constants & Helpers
// ============================================================

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

const createModalAction = (
  type: ExtraModalType,
  isActive: (item: OperationItem) => boolean,
  modalSize = DEFAULT_MODAL_SIZE,
  label = type.charAt(0).toUpperCase() + type.slice(1),
): ViewActionDefinition => ({
  key: type,
  label,
  type: "modal",
  modalType: type,
  modalSize,
  isActive,
  execute: (_item, store) => {
    store.openGlobalModal(
      React.createElement(OperationModal, {
        type,
        onClose: store.closeGlobalModal,
      }),
      { title: label, ...modalSize },
    );
  },
});

// ============================================================
// View Configuration
// ============================================================

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
    // 1. JC ジョブ実行 (Menuクリックで実行 -> LOADING表示 -> 完了後に自動解除)
    {
      key: "jc",
      label: "JC",
      type: "custom",
      isActive: (item) =>
        Boolean("jobId" in item && item.jobId && item.jobId !== "-"),
      execute: async (item) => {
        if (item.kanriNo) {
          await useAppStore.getState().runJcJob(String(item.kanriNo));
        }
      },
    },

    // 2. Script ジョブ実行 (Menuクリックで実行 -> LOADING表示 -> 完了後に自動解除)
    {
      key: "script",
      label: "script",
      type: "custom",
      isActive: (item) => Boolean(item.script),
      execute: async (item) => {
        if (item.kanriNo) {
          await useAppStore.getState().runScriptJob(String(item.kanriNo));
        }
      },
    },

    // 3. Link
    createModalAction("link", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),

    // 4. Manual
    {
      key: "manual",
      label: "Manual",
      type: "custom",
      isActive: (item) => Boolean(item?.kanriNo),
      execute: async (item) => {
        const kanriNoStr = String(item.kanriNo).trim();

        // 管理番号のエイリアスマップ（統合先への置き換え定義）
        const MANUAL_ALIAS_MAP: Record<string, string> = {
          "37": "30",
          "45": "30",
          "48": "30",
          "54": "30",
          "36": "29",
          "44": "29",
          "47": "29",
          "43": "28",
          "68": "28",
        };

        const targetKanriNo = MANUAL_ALIAS_MAP[kanriNoStr] ?? kanriNoStr;

        const targetUrl = `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
        await commands.openExternal(targetUrl);
      },
    },
  ],
};

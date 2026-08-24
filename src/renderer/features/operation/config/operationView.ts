import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";
import type {
  AppViewDefinition,
  ViewActionDefinition,
} from "@shared/types/appRegistryType";
import type { OperationItem } from "@shared/types/operationType";
import { APP_VIEW_IDS, type ExtraModalType } from "@shared/types/uiType";

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

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
    // コンポーネントの直接インポートを避け、modalType を介して開く
    store.openGlobalModal(null, { title: label, ...modalSize });
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
    createModalAction("link", (item) =>
      Boolean(item.link && Object.keys(item.link).length > 0),
    ),
    {
      key: "manual",
      label: "Manual",
      type: "custom",
      isActive: (item) => Boolean(item?.kanriNo),
      execute: async (item) => {
        const kanriNoStr = String(item.kanriNo).trim();
        const targetKanriNo = MANUAL_ALIAS_MAP[kanriNoStr] ?? kanriNoStr;
        const targetUrl = `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
        await commands.openExternal(targetUrl);
      },
    },
  ],
};

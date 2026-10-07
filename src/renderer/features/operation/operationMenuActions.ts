// src/renderer/features/operation/operationMenuActions.ts

import { getManualScriptKeys } from "@shared/config/operationScriptRegistry";
import { getManualUrl } from "@renderer/features/operation/helpers/entityUtils";
import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import { systemCommands } from "@renderer/services/commands";
import { type AppState, useAppStore } from "@renderer/store";
import type {
  LinkConfig,
  OperationViewItem,
  SelectedOperationItem,
} from "@shared/types/operation/operationTypes";
import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

import { openLinkModal, openScriptModal } from "./operationModal";

type OpenGlobalModal = AppState["openGlobalModal"];

export interface ViewAction {
  key: string;
  label: string;
  execute: (item: SelectedOperationItem) => void | Promise<void>;
}

const isOperationMaster = (item: OperationViewItem): item is OperationMaster =>
  "jobId" in item;

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!("link" in item) || !item.link) {
    return [];
  }

  return item.link.split(",").map((entry, index) => {
    const separator = entry.indexOf(":");

    if (separator === -1) {
      return {
        key: `link${index + 1}`,
        url: entry,
      };
    }

    return {
      key: entry.slice(0, separator),
      url: entry.slice(separator + 1),
    };
  });
}

function hasManualEnabled(item: OperationViewItem): boolean {
  if (isOperationMaster(item)) {
    return item.manualUrl === "true" || item.AutoManualUrl === "true";
  }

  return "manualUrl" in item && item.manualUrl === "true";
}

function createJcAction(item: SelectedOperationItem): ViewAction | null {
  if (!isOperationMaster(item) || !item.jobId) {
    return null;
  }

  return {
    key: "jc",
    label: "JC",
    execute: () => executeJcJob(useAppStore.getState(), item.kanriNo),
  };
}

function createScriptAction(
  item: SelectedOperationItem,
  openGlobalModal: OpenGlobalModal,
): ViewAction | null {
  const scriptKeys = getManualScriptKeys(item.kanriNo);

  if (scriptKeys.length === 0) {
    return null;
  }

  return {
    key: "script",
    label: "Script",
    execute: () => {
      openScriptModal(openGlobalModal, item);
    },
  };
}

function createLinkAction(
  links: LinkConfig[],
  openGlobalModal: OpenGlobalModal,
): ViewAction | null {
  if (links.length === 0) {
    return null;
  }

  return {
    key: "link",
    label: "Link",
    execute: () => {
      openLinkModal(openGlobalModal, links);
    },
  };
}

function createManualAction(item: SelectedOperationItem): ViewAction | null {
  if (!hasManualEnabled(item)) {
    return null;
  }

  return {
    key: "manual",
    label: "Manual",
    execute: async () => {
      await systemCommands.openExternal(getManualUrl(item.kanriNo));
    },
  };
}

export function createActiveActions(
  item: SelectedOperationItem,
  openGlobalModal: OpenGlobalModal,
): ViewAction[] {
  const links = getLinkConfigs(item);

  return [
    createJcAction(item),
    createScriptAction(item, openGlobalModal),
    createLinkAction(links, openGlobalModal),
    createManualAction(item),
  ].filter((action): action is ViewAction => action !== null);
}

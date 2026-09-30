import { createElement } from "react";

import { getManualScriptKeys } from "@electron/features/operation/config/operationScriptRegistry";
import { getManualUrl } from "@renderer/features/operation/helpers/entityUtils";
import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import { rdpService } from "@renderer/features/remoteDesktop/services/rdpService";
import { systemCommands } from "@renderer/services/commands";
import { type AppState, useAppStore } from "@renderer/store";
import type {
  LinkConfig,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import { LinkModalContent } from "./components/modal/linkModal/LinkModalContent";
import { ScriptModalContent } from "./components/modal/scriptModal/ScriptModalContent";

export type OperationViewItem =
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster;

export type SelectedOperationItem = OperationViewItem & OperationStatusState;

export interface ViewAction {
  key: string;
  label: string;
  execute: (item: SelectedOperationItem) => void | Promise<void>;
}

const RDP_SCRIPT_KEYS = ["WEBEDI_DB", "WEBEDI"];

const isOperationMaster = (item: OperationViewItem): item is OperationMaster =>
  "jobId" in item;

function getLinkConfigs(item: OperationViewItem): LinkConfig[] {
  if (!("link" in item) || !item.link) {
    return [];
  }

  return item.link.split(",").map((entry, index) => {
    const separator = entry.indexOf(":");

    return separator === -1
      ? {
          key: `link${index + 1}`,
          url: entry,
        }
      : {
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

function createScriptModal(item: SelectedOperationItem, scriptKey: string) {
  const Content = () => createElement(ScriptModalContent, { item, scriptKey });

  Object.assign(Content, ScriptModalContent);

  return Content;
}

function createLinkModal(links: LinkConfig[]) {
  const Content = () => createElement(LinkModalContent, { link: links });

  Object.assign(Content, LinkModalContent);

  return Content;
}

export function createActiveActions(
  item: SelectedOperationItem,
  openGlobalModal: AppState["openGlobalModal"],
): ViewAction[] {
  const actions: ViewAction[] = [];
  const links = getLinkConfigs(item);

  if (isOperationMaster(item) && item.jobId) {
    actions.push({
      key: "jc",
      label: "JC",
      execute: () => executeJcJob(useAppStore.getState(), item.kanriNo),
    });
  }

  for (const scriptKey of getManualScriptKeys(item.kanriNo)) {
    if (RDP_SCRIPT_KEYS.includes(scriptKey)) {
      actions.push({
        key: `rdp_${scriptKey}`,
        label: scriptKey,
        execute: () => rdpService.startSession(scriptKey),
      });
      continue;
    }

    actions.push({
      key: `script_${scriptKey}`,
      label: `Script (${scriptKey})`,
      execute: () => {
        openGlobalModal(createScriptModal(item, scriptKey), {
          title: `${item.workName || "スクリプト"} (${scriptKey})`,
        });
      },
    });
  }

  if (links.length) {
    actions.push({
      key: "link",
      label: "Link",
      execute: () => {
        openGlobalModal(createLinkModal(links), {
          title: "リンク一覧",
        });
      },
    });
  }

  if (hasManualEnabled(item)) {
    actions.push({
      key: "manual",
      label: "Manual",
      execute: () => systemCommands.openExternal(getManualUrl(item.kanriNo)),
    });
  }

  return actions;
}

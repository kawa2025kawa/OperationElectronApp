// src/renderer/features/operation/operationModal.ts

import { createElement } from "react";

import { getScriptModalType } from "@shared/config/operationScriptRegistry";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import { type AppState } from "@renderer/store";
import type {
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

import { LinkModalContent } from "./components/modal/linkModal/LinkModalContent";
import { ScriptModalContent } from "./components/modal/scriptModal/ScriptModalContent";

type OpenGlobalModal = AppState["openGlobalModal"];

const PDF_UPLOAD_MODAL_CONFIG = {
  title: "Tempomatic PDF",
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

const SCRIPT_MODAL_CONFIG = {
  width: "min(85vw, calc(75vh * 16 / 9))",
  height: "min(75vh, calc(85vw * 9 / 16))",
};

const LINK_MODAL_CONFIG = {
  title: "リンク一覧",
  width: "min(85vw, 800px)",
  height: "min(80vh, 700px)",
};

export function openScriptModal(
  openGlobalModal: OpenGlobalModal,
  item: OperationViewItem,
): void {
  const modalType = getScriptModalType(item.kanriNo);

  if (modalType === "pdfUpload") {
    openGlobalModal(createElement(PdfUploadModalContent), {
      ...PDF_UPLOAD_MODAL_CONFIG,
    });
    return;
  }

  openGlobalModal(createElement(ScriptModalContent, { item }), {
    ...SCRIPT_MODAL_CONFIG,
    title: item.workName || "スクリプト実行",
  });
}

export function openLinkModal(
  openGlobalModal: OpenGlobalModal,
  links: LinkConfig[],
): void {
  openGlobalModal(createElement(LinkModalContent, { link: links }), {
    ...LINK_MODAL_CONFIG,
  });
}

// src/renderer/features/operation/operationModal.ts

import { createElement } from "react";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import type { AppState } from "@renderer/store";
import type {
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { getOperationWorkName } from "./operationDisplayUtils";
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

/** PDFアップロードモーダルを開く */
export function openPdfUploadModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(
    createElement(PdfUploadModalContent),
    PDF_UPLOAD_MODAL_CONFIG,
  );
}

/** スクリプト実行モーダルを開く */
export function openScriptModal(
  openGlobalModal: OpenGlobalModal,
  item: OperationViewItem,
  scriptKey?: string,
): void {
  const workName = getOperationWorkName(item.workName, item.kanriNo);

  openGlobalModal(
    createElement(ScriptModalContent, {
      item: { ...item, workName },
      scriptKey: scriptKey ?? String(item.kanriNo),
    }),
    {
      ...SCRIPT_MODAL_CONFIG,
      title: scriptKey ? `${workName} (${scriptKey})` : workName,
    },
  );
}

/** リンク一覧モーダルを開く */
export function openLinkModal(
  openGlobalModal: OpenGlobalModal,
  links: LinkConfig[],
): void {
  openGlobalModal(createElement(LinkModalContent, { link: links }), {
    ...LINK_MODAL_CONFIG,
  });
}

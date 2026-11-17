// src/renderer/features/operation/components/modal/operationModal.ts

import { createElement } from "react";
import { GmailDraftContent } from "@renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import type { AppState } from "@renderer/store";
import type {
  LinkConfig,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { MODAL_PRESETS } from "@shared/types/ui/modal";
import { getOperationWorkName } from "../../utils/operationDisplayUtils";
import { LinkModalContent } from "./linkModal/LinkModalContent";
import { ScriptModalContent } from "./scriptModal/ScriptModalContent";

type OpenGlobalModal = AppState["openGlobalModal"];

const GMAIL_MODAL_CONFIG = {
  title: "Gmail",
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
} as const;

/** Gmail 作成モーダルを開く */
export function openGmailModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(createElement(GmailDraftContent), GMAIL_MODAL_CONFIG);
}

/** PDFアップロードモーダルを開く */
export function openPdfUploadModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(
    createElement(PdfUploadModalContent),
    MODAL_PRESETS.PDF_UPLOAD,
  );
}

/** スクリプト実行モーダルを開く */
export function openScriptModal(
  openGlobalModal: OpenGlobalModal,
  item: OperationViewItem,
  scriptKey?: string,
): void {
  const workName = getOperationWorkName(item.workName, item.kanriNo);
  const title = item.kanriNo ? `[${item.kanriNo}] ${workName}` : workName;

  openGlobalModal(
    createElement(ScriptModalContent, {
      item: { ...item, workName },
      scriptKey: scriptKey ?? String(item.kanriNo),
    }),
    {
      ...MODAL_PRESETS.SCRIPT_EXECUTION,
      title,
    },
  );
}

/** リンク一覧モーダルを開く */
export function openLinkModal(
  openGlobalModal: OpenGlobalModal,
  links: LinkConfig[],
): void {
  openGlobalModal(createElement(LinkModalContent, { link: links }), {
    ...MODAL_PRESETS.LINK_LIST,
  });
}

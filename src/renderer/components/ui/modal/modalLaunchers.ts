// src/renderer/components/ui/modal/modalLaunchers.ts

import { createElement } from "react";

import { LinkModalContent } from "@renderer/features/operation/components/modal/linkModal/LinkModalContent";
import { ScriptModalContent } from "@renderer/features/operation/components/modal/scriptModal/ScriptModalContent";
import type { LinkConfig } from "@renderer/features/operation/utils/operationActionUtils";
import { getOperationWorkName } from "@renderer/features/operation/utils/operationDisplayUtils";
import { GiftMdModalContent } from "@renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "@renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import { ResetStatusModalContent } from "@renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent";
import { StatusSyncModalContent } from "@renderer/features/other/components/modal/contents/statusSync/StatusSyncModalContent";
import type { AppState } from "@renderer/store";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import { MODAL_PRESETS, MODAL_SIZES } from "@renderer/types/modal";

export type OpenGlobalModal = AppState["openGlobalModal"];

/** Gmail 作成モーダルを開く */
export function openGmailModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(createElement(GmailDraftContent), {
    title: "Gmail",
    ...MODAL_SIZES.ULTRA_WIDE_21_9,
  });
}

/** PDFアップロードモーダルを開く */
export function openPdfUploadModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(
    createElement(PdfUploadModalContent),
    MODAL_PRESETS.PDF_UPLOAD,
  );
}

/** ギフトMD処理モーダルを開く */
export function openGiftMdModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(createElement(GiftMdModalContent), {
    title: "ギフトMD処理",
    ...MODAL_SIZES.ULTRA_WIDE_21_9,
  });
}

/** ステータス全リセットモーダルを開く */
export function openResetStatusModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(createElement(ResetStatusModalContent), {
    title: "ステータスの全リセット",
    ...MODAL_PRESETS.SCRIPT_EXECUTION,
  });
}

/** Status 引き継ぎモーダルを開く */
export function openStatusSyncModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(createElement(StatusSyncModalContent), {
    title: "Status 引き継ぎ",
    ...MODAL_SIZES.WIDE_16_9,
  });
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
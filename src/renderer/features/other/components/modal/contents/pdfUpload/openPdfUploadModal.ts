// src/renderer/features/other/components/modal/contents/pdfUpload/openPdfUploadModal.ts

import { createElement } from "react";

import type { AppState } from "@renderer/store";
import { PdfUploadModalContent } from "./PdfUploadModalContent";

type OpenGlobalModal = AppState["openGlobalModal"];

const PDF_UPLOAD_MODAL_CONFIG = {
  title: "Tempomatic PDF",
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

export function openPdfUploadModal(openGlobalModal: OpenGlobalModal): void {
  openGlobalModal(
    createElement(PdfUploadModalContent),
    PDF_UPLOAD_MODAL_CONFIG,
  );
}

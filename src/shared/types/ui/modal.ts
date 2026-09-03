export const OPERATION_MODAL_TYPES = {
  SUMMARY: "summary",
  LINK: "link",
} as const;

export const OTHER_MODAL_TYPES = {
  PDF_UPLOAD: "pdfUpload",
  GMAIL: "gmail",
} as const;

export const EXTRA_MODAL_TYPES = {
  ...OPERATION_MODAL_TYPES,
  ...OTHER_MODAL_TYPES,
  JC: "jc",
  SCRIPT: "script",
  MANUAL: "manual",
} as const;

export type ExtraModalType =
  (typeof EXTRA_MODAL_TYPES)[keyof typeof EXTRA_MODAL_TYPES];

export interface GlobalModalConfig {
  title?: string;
  width?: string;
  height?: string;
}
// src/renderer/features/other/types/gmailDraftTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10";

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

export const EMAIL_TEMPLATE_OPTIONS = [
  { key: "E8", label: "シェルフラベル発注" },
  { key: "E9", label: "各種ポップラベル発注" },
  { key: "E10", label: "TV売上集計&メール" },
] as const satisfies readonly EmailTemplateOption[];

export interface GmailDraftFormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface GmailDraftState {
  templateKey: EmailTemplateKey | null;
  formValues: GmailDraftFormValues;
  isProcessing: boolean;
}

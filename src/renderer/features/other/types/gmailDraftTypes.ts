// src/renderer/features/other/types/gmailDraftTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10";

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

export const EMAIL_TEMPLATE_OPTIONS = [
  { key: "E8", label: "棚割データ" },
  { key: "E9", label: "POPデータ" },
  { key: "E10", label: "実績データ" },
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

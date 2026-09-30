// src/renderer/features/other/types/gmailDraftTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10";

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

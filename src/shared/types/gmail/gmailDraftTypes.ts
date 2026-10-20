//src\shared\types\gmail\gmailDraftTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10" | "E88";

export interface GmailDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface GmailDraftFormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

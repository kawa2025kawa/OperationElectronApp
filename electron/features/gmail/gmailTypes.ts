// electron/features/gmail/gmailTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10";

export interface GmailDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface GmailSendAs {
  isPrimary?: boolean;
  signature?: string;
}

export interface GmailSendAsResponse {
  sendAs?: GmailSendAs[];
}

export interface GenerateDraftTemplateParams {
  templateKey: EmailTemplateKey;
  familyName?: string;
  links?: Record<string, string> | null;
}

export interface BuildRawMessageParams {
  from?: string | null;
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

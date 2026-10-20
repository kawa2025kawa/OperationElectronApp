import type {
  EmailTemplateKey,
  GmailDraft,
} from "@shared/types/gmail/gmailDraftTypes";

export type {
  EmailTemplateKey,
  GmailDraft,
} from "@shared/types/gmail/gmailDraftTypes";

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
  ym?: string;
}

export interface BuildRawMessageParams {
  from?: string | null;
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

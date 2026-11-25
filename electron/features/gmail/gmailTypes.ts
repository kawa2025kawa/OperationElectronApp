// electron/features/gmail/gmailTypes.ts

import type { EmailTemplateKey } from "@shared/types/electron/ipcTypes";

export type {
  EmailTemplateKey,
  GmailDraft,
} from "@shared/types/electron/ipcTypes";

interface GmailSendAs {
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

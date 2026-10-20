// src/renderer/features/other/types/gmailDraftTypes.ts

import type {
  EmailTemplateKey,
  GmailDraftFormValues,
  EmailTemplateOption,
} from "@shared/types/gmail/gmailDraftTypes";

export type { EmailTemplateKey } from "@shared/types/gmail/gmailDraftTypes";
export type { GmailDraftFormValues } from "@shared/types/gmail/gmailDraftTypes";

export const EMAIL_TEMPLATE_OPTIONS = [
  { key: "E8", label: "シェルフラベル発注" },
  { key: "E9", label: "各種ポップラベル発注" },
  { key: "E10", label: "TV売上集計&メール" },
  { key: "E88", label: "新店シェルフラベル発注" },
] as const satisfies readonly EmailTemplateOption[];

export interface GmailDraftState {
  templateKey: EmailTemplateKey | null;
  formValues: GmailDraftFormValues;
  isProcessing: boolean;
}

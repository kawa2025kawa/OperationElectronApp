// electron/features/gmail/templates/templateFactory.ts

import type { EmailTemplateKey, GmailDraft } from "../gmailTypes";

import { createTemplateE8 } from "./templateE8";
import { createTemplateE9 } from "./templateE9";
import { createTemplateE10 } from "./templateE10";
import { createTemplateE88 } from "./templateE88";

interface TemplateParams {
  familyName?: string;
  links?: Record<string, string> | null;
  ym?: string;
}

type TemplateFactory = (params: TemplateParams) => GmailDraft;

const templateFactories: Record<EmailTemplateKey, TemplateFactory> = {
  E8: () => createTemplateE8(),
  E9: () => createTemplateE9(),
  E10: ({ familyName }) => createTemplateE10(familyName),
  E88: ({ familyName }) => createTemplateE88(familyName),
};

export function createEmailTemplate(
  templateKey: EmailTemplateKey,
  params: TemplateParams = {},
): GmailDraft {
  return templateFactories[templateKey](params);
}

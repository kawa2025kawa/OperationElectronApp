//electron\features\gmail\templates\templateFactory.ts

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
  E8: ({ familyName, links }) => createTemplateE8(familyName, links),
  E9: ({ familyName, links }) => createTemplateE9(familyName, links),
  E10: ({ familyName, links }) => createTemplateE10(familyName, links),
  E88: ({ familyName, links, ym }) => createTemplateE88(familyName, links, ym),
};

export function createEmailTemplate(
  templateKey: EmailTemplateKey,
  params: TemplateParams = {},
): GmailDraft {
  return templateFactories[templateKey](params);
}

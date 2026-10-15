import type {
  EmailTemplateKey,
  GmailDraft,
} from "../gmailTypes";

import { createTemplateE8 } from "./templateE8";
import { createTemplateE9 } from "./templateE9";
import { createTemplateE10 } from "./templateE10";

interface TemplateParams {
  familyName?: string;
  links?: Record<string, string> | null;
}

const templateFactories: Record<
  EmailTemplateKey,
  (params: TemplateParams) => GmailDraft
> = {
  E8: ({ familyName, links }) => createTemplateE8(familyName, links),
  E9: ({ familyName, links }) => createTemplateE9(familyName, links),
  E10: ({ familyName, links }) => createTemplateE10(familyName, links),
};

export function createEmailTemplate(
  templateKey: EmailTemplateKey,
  params: TemplateParams = {},
): GmailDraft {
  return templateFactories[templateKey](params);
}
// src/renderer/features/other/services/gmailDraftService.ts

import {
  formatEmailAddresses,
  stripHtmlTags,
} from "@renderer/features/other/utils/gmailModalUtils";
import { getEmailTemplate } from "@renderer/features/other/templates/gmailTemplates";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftTypes";
import { gmailApiService } from "@renderer/features/other/services/gmailApiService";

export interface GmailDraftTemplateContext {
  lastName: string;
  nextTuesdayStr: string;
}

function createDraftFromTemplate(
  key: EmailTemplateKey,
  context: GmailDraftTemplateContext,
): GmailDraftFormValues {
  const template = getEmailTemplate(key);

  return {
    to: template.to,
    cc: template.cc ?? "",
    subject: template.subject,
    body: template.generateBody(context),
  };
}

async function appendPrimarySignature(body: string): Promise<string> {
  const signature = await gmailApiService.getPrimarySignature();

  const plainSignature = stripHtmlTags(signature);

  if (!plainSignature) {
    return body;
  }

  if (body.includes(plainSignature)) {
    return body;
  }

  const normalizedBody = body.trimEnd();

  if (!normalizedBody) {
    return `--\n${plainSignature}`;
  }

  return `${normalizedBody}\n\n--\n${plainSignature}`;
}

async function createDraftFromTemplateWithSignature(
  key: EmailTemplateKey,
  context: GmailDraftTemplateContext,
): Promise<GmailDraftFormValues> {
  const draft = createDraftFromTemplate(key, context);

  const body = await appendPrimarySignature(draft.body);

  return {
    ...draft,
    body,
  };
}

async function createDraft(params: GmailDraftFormValues): Promise<void> {
  const to = formatEmailAddresses(params.to);

  if (!to) {
    throw new Error("宛先 (To) を入力してください。");
  }

  await gmailApiService.createDraft({
    to,
    cc: formatEmailAddresses(params.cc),
    subject: params.subject.trim(),
    body: params.body,
  });
}

export const gmailDraftService = {
  createDraft,
  createDraftFromTemplate,
  createDraftFromTemplateWithSignature,
};

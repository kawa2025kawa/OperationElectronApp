// src/renderer/features/operation/components/modal/gmailModal/templates/index.ts

import type { EmailTemplate } from "./types";
import { shelfLabelTemplate } from "./shelfLabel";
import { popLabelTemplate } from "./popLabel";

export type EmailTemplateKey = "E8" | "E9";

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
  template: EmailTemplate;
}

// =====================================================
// Templates
// =====================================================

const TEMPLATES_BY_KANRI_NO: Record<EmailTemplateKey, EmailTemplate> = {
  E8: shelfLabelTemplate,
  E9: popLabelTemplate,
};

// =====================================================
// Template Options
// =====================================================

export const EMAIL_TEMPLATE_OPTIONS: readonly EmailTemplateOption[] = [
  {
    key: "E8",
    label: "シェルフラベル",
    template: shelfLabelTemplate,
  },
  {
    key: "E9",
    label: "POPデータ",
    template: popLabelTemplate,
  },
];

// =====================================================
// Default
// =====================================================

const defaultTemplate: EmailTemplate = {
  to: "",
  subject: "【作業連絡】",
  generateBody: ({ lastName }) =>
    `ご担当者様\n\nお世話になっております。ベルクの${lastName}です。\n\nよろしくお願いいたします。`,
};

// =====================================================
// Resolve
// =====================================================

export function getEmailTemplate(kanriNo?: string): EmailTemplate {
  if (!kanriNo) {
    return defaultTemplate;
  }

  return TEMPLATES_BY_KANRI_NO[kanriNo as EmailTemplateKey] ?? defaultTemplate;
}

function getEmailTemplateKey(kanriNo?: string): EmailTemplateKey | null {
  if (!kanriNo) {
    return null;
  }

  return kanriNo in TEMPLATES_BY_KANRI_NO
    ? (kanriNo as EmailTemplateKey)
    : null;
}

function getEmailTemplateLabel(key: EmailTemplateKey): string {
  return (
    EMAIL_TEMPLATE_OPTIONS.find((option) => option.key === key)?.label ?? key
  );
}

export * from "./types";

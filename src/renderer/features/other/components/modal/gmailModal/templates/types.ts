export interface EmailTemplateContext {
  lastName: string;
  nextTuesdayStr: string;
  links?: Record<string, string> | null;
}

export interface EmailTemplate {
  to: string;
  cc?: string;
  subject: string;
  generateBody: (ctx: EmailTemplateContext) => string;
}

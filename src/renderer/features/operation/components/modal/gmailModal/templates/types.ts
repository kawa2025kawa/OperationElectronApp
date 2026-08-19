//src\renderer\features\operation\components\modal\gmailModal\templates\types.ts

export interface EmailTemplateContext {
  lastName: string; // $1: 苗字
  nextTuesdayStr: string; // $2: 来週火曜日
  links?: Record<string, string> | null;
}

export interface EmailTemplate {
  to: string;
  cc?: string;
  subject: string;
  generateBody: (ctx: EmailTemplateContext) => string;
}

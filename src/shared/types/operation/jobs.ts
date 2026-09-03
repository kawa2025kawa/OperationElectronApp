// src/shared/types/operation/jobs.ts
import type { JobDependency } from "./dependency";
import type { OperationStatusFields } from "./status";
import type { ScheduledTime } from "./time";

export interface GmailTemplate {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

export interface OperationJobItem extends OperationStatusFields {
  kind: "operation"; // タグを追加
  kanriNo: string;
  workName: string;
  jobId?: string;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export interface IrregularJobItem extends OperationStatusFields {
  kind: "irregular"; // タグを追加
  kanriNo: string;
  workName: string;
  cycle1?: string | null;
  cycle2?: string | null;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export type OperationItem = OperationJobItem | IrregularJobItem;

// src/shared/types/operation/jobs.ts

import type { JobDependency } from "./dependency";
import type { OperationStatusFields } from "./status";
import type { ScheduledTime } from "./time";

/* ============================================================================
 * Center & Active Flags Types
 * ========================================================================== */

export type CenterId = "1C" | "2C" | "3C";

export type ActiveFlags = Record<`is${CenterId}Active`, boolean>;

export const CENTER_IDS: readonly CenterId[] = ["1C", "2C", "3C"];

export const DEFAULT_ACTIVE_FLAGS: ActiveFlags = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

export function getCenterKey(id: CenterId): keyof ActiveFlags {
  return `is${id}Active`;
}

/* ============================================================================
 * Job Types
 * ========================================================================== */

export interface GmailTemplate {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

export interface ScriptConfig {
  key: string;
  label: string;
  scriptKanriNo?: string;
  autoStart?: boolean;
}

export interface OperationJobItem extends OperationStatusFields {
  kanriNo: string;
  workName: string;
  jobId?: string;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;

  scripts?: ScriptConfig[] | null;

  script?: boolean | null;
  autoStart?: boolean | null;

  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export interface IrregularJobItem extends OperationStatusFields {
  kanriNo: string;
  workName: string;
  cycle1?: string | null;
  cycle2?: string | null;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;

  scripts?: ScriptConfig[] | null;

  script?: boolean | null;
  autoStart?: boolean | null;

  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export type OperationItem = OperationJobItem | IrregularJobItem;

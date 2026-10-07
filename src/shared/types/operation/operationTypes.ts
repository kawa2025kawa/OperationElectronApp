// src/shared/types/operation/operationTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Center
 * ========================= */

export const CenterId = {
  VALUES: ["1C", "2C", "3C"] as const,
} as const;

export type CenterId = (typeof CenterId.VALUES)[number];

export type ActiveFlags = Record<`is${CenterId}Active`, boolean>;

export const DEFAULT_ACTIVE_FLAGS: ActiveFlags = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

/* =========================
 * Job Status
 * ========================= */

export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  RUNNING: "running",
  SCRIPT_RUNNING: "scriptRunning",
  SUCCESS: "success",
  READY: "ready",
  WAITING: "waiting",
  ERROR: "error",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUS_VALUES = [
  JOB_STATUS.SCHEDULED,
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.READY,
  JOB_STATUS.WAITING,
  JOB_STATUS.ERROR,
] as const satisfies readonly JobStatus[];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  [JOB_STATUS.SCHEDULED]: "予定",
  [JOB_STATUS.RUNNING]: "実行中",
  [JOB_STATUS.SCRIPT_RUNNING]: "処理中",
  [JOB_STATUS.SUCCESS]: "完了",
  [JOB_STATUS.READY]: "実施可",
  [JOB_STATUS.WAITING]: "待合",
  [JOB_STATUS.ERROR]: "エラー",
};

/* =========================
 * Common
 * ========================= */

export type ScheduledTime = string;

export interface JobArtifact {
  name: string;
  path?: string;
  size?: number;
}

export interface JobResult {
  message: string;
  success?: boolean;
  data?: unknown;
  artifacts?: JobArtifact[];
}

export interface JobDependency {
  dependsOn?: string | string[] | null;
}

export interface JobDependenciesConfig {
  dependencies: Record<string, JobDependency>;
}

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
}

export interface LinkConfig {
  key: string;
  url: string;
}

/* =========================
 * Operation Status
 * ========================= */

export interface OperationStatusState {
  kanriNo: string;
  status?: JobStatus;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string | null;
  info?: string | null;
}

/* =========================
 * Operation View
 * ========================= */

export type OperationViewItem =
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster;

export type SelectedOperationItem = OperationViewItem & OperationStatusState;

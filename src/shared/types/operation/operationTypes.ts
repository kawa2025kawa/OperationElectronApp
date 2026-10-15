// src/shared/types/operation/operationTypes.ts

export interface OperationLink {
  label: string;
  path: string;
}

/* =========================
 * Operation Master Types
 * ========================= */

export interface OperationMaster {
  kanriNo: string;
  workName: string;
  scheduledTime?: string;
  jobId?: string;
  dependsOn?: string;

  /** Manual ボタンの表示判定・起動先 */
  manualUrl?: string;

  /** AutoManual ボタンの表示判定・起動先 */
  autoManualUrl?: string;

  Script?: boolean;
  ScriptKeys?: OperationScriptKey[];

  link?: boolean;
  links?: OperationLink[];

  other1?: string;
  other2?: string;
}

export interface IrregularMaster {
  kanriNo: string;
  workName: string;
  scheduledTime?: string;
  cycle?: string;
  dependsOn?: string;

  /** Manual ボタンの表示判定・起動先 */
  manualUrl?: string;

  /** AutoManual ボタンの表示判定・起動先 */
  autoManualUrl?: string;

  Script?: boolean;
  ScriptKeys?: OperationScriptKey[];

  link?: boolean;
  links?: OperationLink[];

  other1?: string;
  other2?: string;
}

export type TodayIrregularMaster = IrregularMaster;

/* =========================
 * Script
 * ========================= */

export type ScriptExecutionType = "manual" | "auto";

export interface OperationScriptKey {
  key: string;
  executionType: ScriptExecutionType;
  requiresFileSelection?: boolean;
}

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
  [JOB_STATUS.READY]: "実行可能",
  [JOB_STATUS.WAITING]: "待機",
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

export type JobResultKind = "success" | "difference" | "error";

export interface JobResult {
  message: string;
  success?: boolean;
  kind?: JobResultKind;
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

export type OperationViewItem = (
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster
) & {
  isPdfUpload?: boolean;
  status?: JobStatus;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type SelectedOperationItem = OperationViewItem & OperationStatusState;

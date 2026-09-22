//src\shared\types\operation\operationTypes.ts

export type CenterId = (typeof CenterId.VALUES)[number];
export const CenterId = {
  VALUES: ["1C", "2C", "3C"] as const,
};

export type ActiveFlags = Record<`is${CenterId}Active`, boolean>;
export const DEFAULT_ACTIVE_FLAGS: ActiveFlags = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

/* ============================================================================
 * Job Status
 * ========================================================================== */

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/**
 * アプリ内部で扱うステータス。
 *
 * 外部/API/Tracker の文字列を直接この型として扱わない。
 * 外部値は必ず normalizeStatus() を通してから使用する。
 */
export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  RUNNING: "running",
  SCRIPT_RUNNING: "scriptRunning",
  SUCCESS: "success",
  READY: "ready",
  WAITING: "waiting",
  ERROR: "error",
} as const;

export type JobStatusValue = (typeof JobStatusValue.VALUES)[number];

export const JobStatusValue = {
  VALUES: [
    JOB_STATUS.SCHEDULED,
    JOB_STATUS.RUNNING,
    JOB_STATUS.SCRIPT_RUNNING,
    JOB_STATUS.SUCCESS,
    JOB_STATUS.READY,
    JOB_STATUS.WAITING,
    JOB_STATUS.ERROR,
  ] as const,
};

/**
 * 外部/APIから返却されるステータスを
 * アプリ内部の JobStatus に変換するためのエイリアス。
 */
const STATUS_ALIAS_MAP: Readonly<Record<string, JobStatus>> = {
  scheduled: JOB_STATUS.SCHEDULED,

  running: JOB_STATUS.RUNNING,
  run: JOB_STATUS.RUNNING,
  processing: JOB_STATUS.RUNNING,

  scriptrunning: JOB_STATUS.SCRIPT_RUNNING,

  success: JOB_STATUS.SUCCESS,
  done: JOB_STATUS.SUCCESS,

  ready: JOB_STATUS.READY,

  waiting: JOB_STATUS.WAITING,
  wait: JOB_STATUS.WAITING,

  error: JOB_STATUS.ERROR,
  failed: JOB_STATUS.ERROR,

  /**
   * 既存仕様:
   * warning は内部的には success として扱う。
   */
  warning: JOB_STATUS.SUCCESS,
};

/* ============================================================================
 * Status Summary
 * ========================================================================== */

export type StatusOrder = (typeof StatusOrder.ORDER)[number];

export const StatusOrder = {
  ORDER: [
    JOB_STATUS.SCHEDULED,
    JOB_STATUS.RUNNING,
    JOB_STATUS.SCRIPT_RUNNING,
    JOB_STATUS.SUCCESS,
    JOB_STATUS.READY,
    JOB_STATUS.WAITING,
    JOB_STATUS.ERROR,
  ] as const,
};

export type SummaryOrder = (typeof SummaryOrder.ORDER)[number];

export const SummaryOrder = {
  ORDER: ["progress", "total", ...StatusOrder.ORDER] as const,
};

export type SummaryDisplayKey = SummaryOrder;

export type StatusSummary = Record<JobStatus | "total" | "progress", number>;

export const EMPTY_STATUS_SUMMARY: StatusSummary = {
  total: 0,
  progress: 0,
  [JOB_STATUS.SCHEDULED]: 0,
  [JOB_STATUS.RUNNING]: 0,
  [JOB_STATUS.SCRIPT_RUNNING]: 0,
  [JOB_STATUS.SUCCESS]: 0,
  [JOB_STATUS.READY]: 0,
  [JOB_STATUS.WAITING]: 0,
  [JOB_STATUS.ERROR]: 0,
};

export const STATUS_LABEL: Record<SummaryDisplayKey, string> = {
  total: "全体",
  progress: "進捗率",
  [JOB_STATUS.SCHEDULED]: "予定",
  [JOB_STATUS.RUNNING]: "実行中",
  [JOB_STATUS.SCRIPT_RUNNING]: "処理中",
  [JOB_STATUS.SUCCESS]: "完了",
  [JOB_STATUS.READY]: "実施可",
  [JOB_STATUS.WAITING]: "待合",
  [JOB_STATUS.ERROR]: "エラー",
};

/* ============================================================================
 * Common Types
 * ========================================================================== */

export type ScheduledTime = string;

export type ExecutionType = "manual" | "auto" | "autoScript" | "manualScript";

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

/* ============================================================================
 * Operation Status
 * ========================================================================== */

export interface OperationStatusState {
  status?: JobStatus;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string | null;
  info?: string | null;
}

/* ============================================================================
 * Operation Status Update
 * ========================================================================== */

export interface OperationItemStatusUpdate {
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

export interface RawOperationStatusUpdate {
  kanriNo: string;
  status?: string | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string | null;
  info?: string | null;
}

/* ============================================================================
 * Operation Items
 * ========================================================================== */

export interface BaseJobItem extends OperationStatusState {
  kanriNo: string;
  workName: string;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  executionType?: ExecutionType | null;
  manualUrl?: boolean;
  autoManualUrl?: boolean;
  link?: LinkConfig[] | null;
  other1?: string | null;
  other2?: string | null;
  scripts?: ScriptConfig[] | null;
  dependency?: JobDependency | null;
}

export interface OperationJobItem extends BaseJobItem {
  jobId?: string;
}

export interface IrregularJobItem extends BaseJobItem {
  cycle1?: string | null;
  cycle2?: string | null;
  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
}

export type OperationItem = OperationJobItem | IrregularJobItem;

/* ============================================================================
 * Tracker API - Raw
 * ========================================================================== */

export interface TrackerApiResponseItem {
  status?: string[];
  start_time?: string;
  end_time?: string;
  expected_start_time?: string;
  expected_end_time?: string;
  comment?: string;
  substatus?: string[];
  info?: string;
}

export interface TrackerApiResponse {
  count: number;
  data: TrackerApiResponseItem[];
}

/* ============================================================================
 * Tracker API - Domain
 * ========================================================================== */

export interface NormalizedTrackerStatus {
  status?: JobStatus;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  comment?: string | null;
  substatus?: JobStatus;
  info?: string | null;
}

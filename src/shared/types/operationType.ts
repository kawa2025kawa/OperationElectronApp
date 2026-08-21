// src/shared/types/operationType.ts

// ============================================================
// Job Status
// ============================================================
export type JobStatus =
  | "scheduled"
  | "running"
  | "scriptRunning"
  | "success"
  | "ready"
  | "waiting"
  | "error";

export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  WAITING: "waiting",
  READY: "ready",
  RUNNING: "running",
  SCRIPT_RUNNING: "scriptRunning",
  SUCCESS: "success",
  ERROR: "error",
} as const satisfies Record<string, JobStatus>;

// ============================================================
// Job Dependencies (依存関係定義)
// ============================================================
export type DependencyCondition = "every" | "some";

export interface JobDependency {
  dependsOn: string[];
  requiredStatus?: JobStatus[] | Record<string, JobStatus[]>;
  condition?: DependencyCondition;
  afterTime?: string;
  requiresActive?: string[];
  requiresAllJobsSuccess?: boolean;
}

// ============================================================
// Status / Result Fields (共通動的フィールド)
// ============================================================

/** 動的に変化するステータス・実行結果の共通フィールド */
export interface OperationStatusFields {
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

/** Tracker API等の外部照会用レスポンス (jobId 基準) */
export interface ApiResult extends OperationStatusFields {
  jobId?: string;
}

/** スクリプト実行結果・StatusManager更新用 (kanriNo 基準) */
export interface ScriptResult extends OperationStatusFields {
  kanriNo: string;
}

// ============================================================
// Supporting Types
// ============================================================

export interface GmailTemplate {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

// ============================================================
// Main Job Types (完全独立定義)
// ============================================================

/** 通常運用ジョブ型 */
export interface OperationJobItem {
  // マスタ固定情報
  kanriNo: string;
  workName: string;
  jobId?: string;
  scheduledTime?: string | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;

  // 動的ステータス情報
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

/** イレギュラー運用ジョブ型 */
export interface IrregularJobItem {
  // マスタ固定情報
  kanriNo: string;
  workName: string;
  cycle1?: string | null;
  cycle2?: string | null;
  scheduledTime?: string | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;

  // 動的ステータス情報
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

/** UI・Store等で汎用的に参照するためのエイリアス */
export type OperationItem = OperationJobItem | IrregularJobItem;

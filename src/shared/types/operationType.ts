// src/shared/types/operationType.ts

/**
 * Operation Job Status
 */
export type JobStatus =
  | "scheduled"
  | "running"
  | "scriptRunning"
  | "success"
  | "ready"
  | "waiting"
  | "error";

/**
 * フロントエンド全体で利用する統一 OperationItem 型
 */
export interface OperationItem {
  kanriNo: string;
  workName: string;
  jobId?: string | null;
  scheduledTime?: string | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  requiresFile?: boolean | null;
  link?: Record<string, string> | null;
  url?: Record<string, string> | null;
  cycle1?: string | null;
  cycle2?: string | null;
  type?: string | null;
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

/**
 * ジョブ依存関係構造型
 */
export type JobDependency = {
  dependsOn?: string[];
  [key: string]: unknown;
};

export type JobDependenciesJson = {
  dependencies: Record<string, string[] | JobDependency>;
  [key: string]: unknown;
};

/**
 * ジョブステータス定数定義
 */
export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  WAITING: "waiting",
  READY: "ready",
  RUNNING: "running",
  scriptRunning: "scriptRunning",
  SUCCESS: "success",
  ERROR: "error",
} as const satisfies Record<string, JobStatus>;

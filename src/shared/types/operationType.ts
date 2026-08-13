// src/shared/types/operationType.ts

export type JobStatus =
  | "scheduled"
  | "running"
  | "scriptRunning"
  | "success"
  | "ready"
  | "waiting"
  | "error";

export interface OperationItem {
  kanriNo: string;
  workName: string;

  jobId?: string | null;

  scheduledTime?: string | null;
  kanshiTime?: string | null;

  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;

  link?: Record<string, string> | null;
  url?: Record<string, string> | null;

  cycle1?: string | null;
  cycle2?: string | null;

  type?: string | null;

  // Status
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
}

export type DependencyCondition = "every" | "some";

export interface JobDependency {
  dependsOn: string[];
  requiredStatus?: string[] | Record<string, string[]>;
  condition?: DependencyCondition;
  afterTime?: string;
  requiresActive?: string[];
}

export interface JobDependenciesJson {
  dependencies: Record<string, JobDependency>;
}

export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  WAITING: "waiting",
  READY: "ready",
  RUNNING: "running",
  SCRIPT_RUNNING: "scriptRunning",
  SUCCESS: "success",
  ERROR: "error",
} as const satisfies Record<string, JobStatus>;

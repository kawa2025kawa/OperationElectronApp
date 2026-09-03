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

export interface OperationStatusFields {
  status?: JobStatus | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
  info?: string | null;
  updatedAt?: string | null;
}
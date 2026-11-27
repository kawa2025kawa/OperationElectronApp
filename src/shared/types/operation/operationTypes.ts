// src/shared/types/operation/operationTypes.ts

interface StatusUpdatedEvent {
  type: "updated";
  update: OperationStatusState;
}

interface StatusClearedEvent {
  type: "cleared";
  kanriNo: string;
}

export type OperationStatusNotification =
  | StatusUpdatedEvent
  | StatusClearedEvent;

/* =========================
- Operation Master Types
- ========================= */

export const WORK_TYPE = {
  AUTO: "自動",
  MANUAL: "手動",
  IMMEDIATE: "即時",
} as const;

export type OperationWorkType = (typeof WORK_TYPE)[keyof typeof WORK_TYPE];

interface BaseOperationMaster {
  kanriNo: string;
  workName: string;
  workType?: OperationWorkType;
  scheduledTime?: string;
  jobId?: string;
  dependsOn?: string | string[] | null;

  manualUrl?: string;
  autoManualUrl?: string;
  ScriptKeys?: OperationScriptKey[];
  RdpKeys?: {
    key: string;
    label?: string;
    executionTypes?: ("manual" | "auto")[];
  }[];
  links?: {
    label: string;
    path: string;
  }[];

  link1?: string;
  link2?: string;
  link3?: string;

  link1Label?: string;
  link2Label?: string;
  link3Label?: string;
}

export type OperationMaster = BaseOperationMaster;

export interface IrregularMaster extends BaseOperationMaster {
  gmail?: boolean;
  cycle?: string;
  cycle1?: string;
  cycle2?: string;
}

export interface OperationScriptKey {
  key: string;
  label?: string;
  executionTypes?: ("manual" | "auto")[];
  requiresFileSelection?: boolean;
}

export interface ScriptExecutionRequirement {
  requiresFileSelection: boolean;
}

export interface ManualScriptExecutionInput {
  kanriNo: string;
  scriptKey?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
}

/* =========================
- Center
- ========================= */

export type ActiveFlags = Record<"is1CActive" | "is2CActive" | "is3CActive", boolean>;

/* =========================
- Job Status
- ========================= */

export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  RUNNING: "running",
  SCRIPT_RUNNING: "scriptRunning",
  SUCCESS: "success",
  READY: "ready",
  WAITING: "waiting",
  NEEDS_ACTION: "needsAction",
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
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
] as const satisfies readonly JobStatus[];

/* =========================
- Common
- ========================= */

export interface JobResult {
  message: string;
  success?: boolean;
  kind?:
    | "success"
    | "difference"
    | "needsAction"
    | "error"
    | "retrying"
    | "running";
  data?: unknown;
  artifacts?: {
    name: string;
    path?: string;
    size?: number;
  }[];
}

/* =========================
- Operation Status
- ========================= */

type OperationErrorSource = "script" | "tracker";

export interface OperationStatusState {
  kanriNo: string;
  status?: JobStatus;
  errorSource?: OperationErrorSource | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string | null;
  info?: string | null;
}

/* =========================
- Operation View
- ========================= */

export type OperationViewItem = (OperationMaster | IrregularMaster) & {
  isPdfUpload?: boolean;
  status?: JobStatus;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

/* =========================
- Summary
- ========================= */

export type StatusSummary = Record<
  "total" | "progress" | (typeof JOB_STATUS_VALUES)[number],
  number
>;

export const EMPTY_STATUS_SUMMARY: StatusSummary = {
  total: 0,
  progress: 0,
  [JOB_STATUS.SCHEDULED]: 0,
  [JOB_STATUS.RUNNING]: 0,
  [JOB_STATUS.SCRIPT_RUNNING]: 0,
  [JOB_STATUS.SUCCESS]: 0,
  [JOB_STATUS.NEEDS_ACTION]: 0,
  [JOB_STATUS.READY]: 0,
  [JOB_STATUS.WAITING]: 0,
  [JOB_STATUS.ERROR]: 0,
};

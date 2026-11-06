// src/shared/types/operation/operationTypes.ts

export interface StatusUpdatedEvent {
  type: "updated";
  update: OperationStatusState;
}

export interface StatusClearedEvent {
  type: "cleared";
  kanriNo: string;
}

export type OperationStatusNotification =
  | StatusUpdatedEvent
  | StatusClearedEvent;

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
  dependsOn?: string | string[] | null;

  /** Manual ボタンの表示判定・起動先 */
  manualUrl?: string;

  /** AutoManual ボタンの表示判定・起動先 */
  autoManualUrl?: string;
  gmail?: boolean;
  ScriptKeys?: OperationScriptKey[];
  RdpKeys?: OperationRdpKey[];
  links?: OperationLink[];

  /** スプレッドシートのリンク先パス */
  link1?: string;
  link2?: string;
  link3?: string;

  /** スプレッドシートのリンクボタン用ラベル */
  link1Label?: string;
  link2Label?: string;
  link3Label?: string;
}

export interface IrregularMaster {
  kanriNo: string;
  workName: string;
  scheduledTime?: string;
  jobId?: string;
  cycle?: string;
  cycle1?: string;
  cycle2?: string;
  dependsOn?: string | string[] | null;

  /** Manual ボタンの表示判定・起動先 */
  manualUrl?: string;

  /** AutoManual ボタンの表示判定・起動先 */
  autoManualUrl?: string;
  gmail?: boolean;
  ScriptKeys?: OperationScriptKey[];
  RdpKeys?: OperationRdpKey[];
  links?: OperationLink[];

  /** スプレッドシートのリンク先パス */
  link1?: string;
  link2?: string;
  link3?: string;

  /** スプレッドシートのリンクボタン用ラベル */
  link1Label?: string;
  link2Label?: string;
  link3Label?: string;
}

export type TodayIrregularMaster = IrregularMaster;

/* =========================
 * Script
 * ========================= */

export const OPERATION_SCRIPT_KEY_IDS = [
  // Eシリーズ
  "E1",
  "E5",
  "E55",
  "E8",
  "E9",
  "E14",
  "E29",
  "E30",
  "E41",
  "E51",
  // Nシリーズ
  "N12",
  "N25",
  "N27",
  "N28",
  "N31",
  "N33",
  // 数字系
  "16",
  "20",
  "25",
  "28",
  "30",
  "34",
  "37",
  "39",
  "43",
  "45",
  "48",
  "54",
  "56",
  "60",
  "62",
  "64",
  "66",
  "68",
  "80",
  "114",
  // 特殊手動キー
  "webedi",
  "webedi_db",
  "md",
] as const;

export type OperationScriptKeyId = (typeof OPERATION_SCRIPT_KEY_IDS)[number];

export type ScriptExecutionType = "manual" | "auto";

export interface OperationScriptKey {
  key: OperationScriptKeyId | string;
  label?: string;
  executionTypes?: ScriptExecutionType[];
  requiresFileSelection?: boolean;
}

/** RDP接続先キー */
export interface OperationRdpKey {
  key: string;
  label?: string;
  executionTypes?: ScriptExecutionType[];
}

export type ScriptFilePath = string | string[];

export interface ScriptExecutionRequirement {
  requiresFileSelection: boolean;
}

export interface ManualScriptExecutionInput {
  kanriNo: string;
  scriptKey?: string;
  filePath?: ScriptFilePath;
  ignoreDependencies?: boolean;
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

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  [JOB_STATUS.SCHEDULED]: "予定",
  [JOB_STATUS.RUNNING]: "実行中",
  [JOB_STATUS.SCRIPT_RUNNING]: "処理中",
  [JOB_STATUS.SUCCESS]: "完了",
  [JOB_STATUS.READY]: "実行可能",
  [JOB_STATUS.WAITING]: "待機",
  [JOB_STATUS.NEEDS_ACTION]: "要対応",
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

export type JobResultKind =
  | "success"
  | "difference"
  | "needsAction"
  | "error"
  | "retrying"
  | "running";

export interface JobRetryPolicy {
  intervalMs: number;
  timeoutMs: number;
}

export interface JobResult {
  message: string;
  success?: boolean;
  kind?: JobResultKind;
  data?: unknown;
  artifacts?: JobArtifact[];
  retryPolicy?: JobRetryPolicy;
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

/* =========================
 * Field Labels (Table & Detail Info)
 * ========================= */

export const OPERATION_FIELD_LABELS = {
  kanriNo: "管理No",
  workName: "業務名",
  scheduledTime: "予定時刻",
  jobId: "ジョブID",
  status: "状態",
  cycle: "サイクル",
  startTime: "開始時刻",
  endTime: "終了時刻",
  comment: "備考",
} as const;

export type OperationFieldKey = keyof typeof OPERATION_FIELD_LABELS;

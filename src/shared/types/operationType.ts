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
  requiresAllJobsSuccess?: boolean; // ★ 追加: 有効なjobIdを持つ全アイテムのStatusがsuccessであることを求めるフラグ
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
// Master Data (設定・固定値データ)
// ============================================================

/** マスタアイテムの共通フィールド */
export interface BaseDataItem {
  kanriNo: string;
  workName: string;
  scheduledTime?: string | null;
  kanshiTime?: string | null;
  manual?: boolean | null;
  script?: boolean | null;
  autoStart?: boolean | null;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

/** 通常運用ジョブ */
export interface OperationDataItem extends BaseDataItem {
  jobId?: string;
}

export interface GmailTemplate {
  to?: string;
  cc?: string; // <-- 追加
  subject?: string;
  body?: string;
}

/** イレギュラー運用ジョブ */
export interface IrregularDataItem extends BaseDataItem {
  cycle1?: string | null;
  cycle2?: string | null;
  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
}

/** 通常・イレギュラーマスタのユニオン型 */
export type MasterDataItem = OperationDataItem | IrregularDataItem;

// ============================================================
// Composite Item (UI / Zustand Store用 結合型)
// ============================================================

/** マスタ情報 ＋ ステータス情報を結合した画面用・Store用型 */
export type OperationItem = MasterDataItem & OperationStatusFields;

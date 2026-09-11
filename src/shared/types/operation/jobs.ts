// src/shared/types/operation/jobs.ts
import type { JobDependency } from "./dependency";
import type { OperationStatusFields } from "./status";
import type { ScheduledTime } from "./time";

export interface GmailTemplate {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

// 🎯 スクリプトごとの設定（自動起動フラグや専用管理Noに対応）
export interface ScriptConfig {
  key: string; // アクション識別キー (例: "main", "check")
  label: string; // UIボタン表示名 (例: "Script", "照会")
  scriptKanriNo?: string; // 実行対象の管理No (未指定時は親の kanriNo を参照)
  autoStart?: boolean; // スクリプト単位の自動実行フラグ
}

export interface OperationJobItem extends OperationStatusFields {
  kind: "operation"; // タグを追加
  kanriNo: string;
  workName: string;
  jobId?: string;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;

  // 🎯 複数スクリプト設定に対応
  scripts?: ScriptConfig[] | null;

  // 互換性維持のための任意フィールド（移行完了後削除可）
  script?: boolean | null;
  autoStart?: boolean | null;

  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export interface IrregularJobItem extends OperationStatusFields {
  kind: "irregular"; // タグを追加
  kanriNo: string;
  workName: string;
  cycle1?: string | null;
  cycle2?: string | null;
  scheduledTime?: ScheduledTime | null;
  kanshiTime?: string | null;
  manual?: boolean | null;

  // 🎯 複数スクリプト設定に対応
  scripts?: ScriptConfig[] | null;

  // 互換性維持のための任意フィールド（移行完了後削除可）
  script?: boolean | null;
  autoStart?: boolean | null;

  gmail?: boolean;
  gmailTemplate?: GmailTemplate;
  link?: Record<string, string> | null;
  dependency?: JobDependency | null;
}

export type OperationItem = OperationJobItem | IrregularJobItem;

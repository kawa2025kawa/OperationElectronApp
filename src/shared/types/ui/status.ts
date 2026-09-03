//src\shared\types\ui\status.//

import type { JobStatus } from "@shared/types/operation";

export const STATUS_ORDER = [
  "scheduled",
  "running",
  "scriptRunning",
  "success",
  "ready",
  "waiting",
  "error",
] as const satisfies readonly JobStatus[];

export const SUMMARY_ORDER = ["progress", "total", ...STATUS_ORDER] as const;

export type SummaryDisplayKey = (typeof SUMMARY_ORDER)[number];

export type StatusSummary = Record<JobStatus | "total" | "progress", number>;

export const EMPTY_STATUS_SUMMARY: StatusSummary = {
  total: 0,
  progress: 0,
  success: 0,
  running: 0,
  scriptRunning: 0,
  error: 0,
  waiting: 0,
  ready: 0,
  scheduled: 0,
};

export const STATUS_LABEL: Record<SummaryDisplayKey, string> = {
  total: "全体",
  progress: "進捗率",
  success: "完了",
  running: "実行中",
  scriptRunning: "処理中",
  waiting: "待合",
  scheduled: "予定",
  ready: "実施可",
  error: "エラー",
};

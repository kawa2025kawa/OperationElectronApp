// src/shared/types/uiType.ts

import type { JobStatus } from "@shared/types/operationType";

/* =====================================================
   1. App View IDs & Modal Types
   ===================================================== */
export const APP_VIEW_IDS = {
  OPERATION: "operation",
  AUTH: "auth",
  RDP: "rdp",
  KOKYUHYO: "kokyuhyo",
  JUGYOIN: "jugyoin",
  SHOP: "shop",
  TANTOU: "tantou",
  OTHER: "other",
} as const;

export type AppViewId = (typeof APP_VIEW_IDS)[keyof typeof APP_VIEW_IDS];

/**
 * OperationModal 用のモーダル種別
 */
const OPERATION_MODAL_TYPES = {
  SUMMARY: "summary",
  LINK: "link",
} as const;

/**
 * OtherModal 用のモーダル種別
 */
const OTHER_MODAL_TYPES = {
  PDF_UPLOAD: "pdfUpload",
  GMAIL: "gmail",
} as const;

/**
 * 全モーダル種別の統合定義（互換性維持用）
 */
const EXTRA_MODAL_TYPES = {
  ...OPERATION_MODAL_TYPES,
  ...OTHER_MODAL_TYPES,
  JC: "jc",
  SCRIPT: "script",
  MANUAL: "manual",
} as const;

export type ExtraModalType =
  (typeof EXTRA_MODAL_TYPES)[keyof typeof EXTRA_MODAL_TYPES];

const VIEW_MODES = ["operation", "irregular", "today"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/* =====================================================
   2. Status & Summary Constants (小文字へ一元化)
   ===================================================== */
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

export const STATUS_LABEL: Record<SummaryDisplayKey | JobStatus, string> = {
  total: "作業件数",
  progress: "進捗率",
  success: "完了",
  running: "実行中",
  scriptRunning: "処理中",
  waiting: "待合",
  scheduled: "予定",
  ready: "実施可",
  error: "エラー",
} as const;

/* =====================================================
   3. Global Modal State & Config
   ===================================================== */
export interface GlobalModalConfig {
  title?: string;
  width?: string;
  height?: string;
}

// src/shared/types/uiType.ts
import type { ReactNode } from "react";
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
} as const;

export type AppViewId = (typeof APP_VIEW_IDS)[keyof typeof APP_VIEW_IDS];

export const EXTRA_MODAL_TYPES = {
  SUMMARY: "summary",
  PDF_UPLOAD: "pdfUpload",
  JC: "jc",
  SCRIPT: "script",
  LINK: "link",
  URL: "url",
  MANUAL: "manual",
} as const;

export type ExtraModalType =
  (typeof EXTRA_MODAL_TYPES)[keyof typeof EXTRA_MODAL_TYPES];
export type OperationModalType = ExtraModalType;

export type ViewMode = "operation" | "irregular" | "today";

/* =====================================================
   2. Status & Summary Constants
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

export const SUMMARY_DISPLAY_ORDER = [
  "PROGRESS",
  "TOTAL",
  ...STATUS_ORDER,
] as const;
export type SummaryDisplayKey = (typeof SUMMARY_DISPLAY_ORDER)[number];

const STATUS_SET = new Set<string>(STATUS_ORDER);
export const isStatusCounter = (value: string): value is JobStatus => {
  return STATUS_SET.has(value);
};

export type StatusSummary = Record<
  Uppercase<JobStatus> | "TOTAL" | "PROGRESS",
  number
>;

export const EMPTY_STATUS_SUMMARY: StatusSummary = {
  TOTAL: 0,
  PROGRESS: 0,
  SUCCESS: 0,
  RUNNING: 0,
  SCRIPTRUNNING: 0,
  ERROR: 0,
  WAITING: 0,
  READY: 0,
  SCHEDULED: 0,
} as const;

export const STATUS_LABEL: Record<JobStatus | "TOTAL" | "PROGRESS", string> = {
  TOTAL: "作業件数",
  PROGRESS: "進捗率",
  success: "完了",
  running: "実行中",
  scriptRunning: "処理中",
  waiting: "待機",
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

export interface GlobalModalSlice {
  modalContent: ReactNode | null;
  modalConfig: GlobalModalConfig | null;
  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

export type ModalMode = "execute" | "completed" | "error";
export type SpreadSheetTab = "shop" | "kokyuhyo" | "jugyoin" | "tantou";

/**
 * JobStatus または任意のステータス文字列から安全に日本語ラベルを取得するヘルパー
 */
export const getStatusLabel = (status?: string | null): string => {
  if (!status) return "-";
  const label = STATUS_LABEL[status as JobStatus];
  return label || status.toUpperCase();
};

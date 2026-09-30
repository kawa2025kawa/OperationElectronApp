// src/shared/types/statusSummary/statusSummaryTypes.ts

import {
  JOB_STATUS,
  JOB_STATUS_VALUES,
} from "@shared/types/operation/operationTypes";

/* =========================
 * Summary Key
 * ========================= */

export type SummaryDisplayKey =
  | "total"
  | "progress"
  | (typeof JOB_STATUS_VALUES)[number];

/* =========================
 * Summary
 * ========================= */

export type StatusSummary = Record<SummaryDisplayKey, number>;

export const EMPTY_STATUS_SUMMARY: StatusSummary = {
  total: 0,
  progress: 0,
  [JOB_STATUS.SCHEDULED]: 0,
  [JOB_STATUS.RUNNING]: 0,
  [JOB_STATUS.SCRIPT_RUNNING]: 0,
  [JOB_STATUS.SUCCESS]: 0,
  [JOB_STATUS.READY]: 0,
  [JOB_STATUS.WAITING]: 0,
  [JOB_STATUS.ERROR]: 0,
};

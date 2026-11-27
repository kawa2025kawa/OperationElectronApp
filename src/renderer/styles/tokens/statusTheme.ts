// src/renderer/styles/statusTheme.ts

import { tokens } from "@renderer/styles/tokens/semantic.contract";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

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

export interface StatusTheme {
  color: string;
  glow: string;
}

const createTheme = (color: string, glow: string): StatusTheme => ({
  color,
  glow,
});

/**
- ステータスごとの色・発光を一元管理する。
- 各 UI はこの定義を参照し、独自の色を持たない。
 */
const statusThemes: Record<JobStatus, StatusTheme> = {
  success: createTheme(tokens.color.status.success, tokens.shadow.glow.success),
  running: createTheme(tokens.color.status.running, tokens.shadow.glow.running),
  scriptRunning: createTheme(
    tokens.color.status.running,
    tokens.shadow.glow.running,
  ),
  waiting: createTheme(tokens.color.status.waiting, tokens.shadow.glow.waiting),
  scheduled: createTheme(
    tokens.color.status.scheduled,
    tokens.shadow.glow.scheduled,
  ),
  ready: createTheme(tokens.color.status.ready, tokens.shadow.glow.ready),
  needsAction: createTheme(
    tokens.color.status.needsAction,
    tokens.shadow.glow.needsAction,
  ),
  error: createTheme(tokens.color.status.error, tokens.shadow.glow.error),
};

export const getStatusTheme = (status: JobStatus): StatusTheme =>
  statusThemes[status];

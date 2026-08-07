// src/renderer/styles/statusTheme.ts

import { tokens } from "@renderer/styles/tokens";
import type { JobStatus } from "@shared/types/operationType";

/* =====================================================
 * 🎯 Theme型
 ===================================================== */

export type StatusTheme = {
  color: string;
  glow: string;
};

/* =====================================================
 * 🎯 ベーステーマ（純UI層）
 ===================================================== */

const baseThemes = {
  success: {
    color: tokens.color.status.success,
    glow: tokens.shadow.glow.success,
  },
  running: {
    color: tokens.color.status.running,
    glow: tokens.shadow.glow.running,
  },
  waiting: {
    // 🎯 修正: pending から waiting に統一
    color: tokens.color.status.waiting,
    glow: tokens.shadow.glow.waiting,
  },
  scheduled: {
    color: tokens.color.status.scheduled,
    glow: tokens.shadow.glow.scheduled,
  },
  ready: {
    // 🎯 修正: scheduled の使い回しをやめ、本来の ready 用スタイルに完全分離！
    color: tokens.color.status.ready,
    glow: tokens.shadow.glow.ready,
  },
  error: {
    color: tokens.color.status.error,
    glow: tokens.shadow.glow.error,
  },
  total: {
    color: tokens.color.status.total,
    glow: tokens.shadow.glow.total,
  },
} as const;

/* =====================================================
 * 🎯 JobStatus → UIテーママッピング
 * ===================================================== */

function resolveTheme(status: JobStatus): keyof typeof baseThemes {
  switch (status) {
    case "success":
      return "success";

    case "running":
      return "running";

    case "waiting":
      return "waiting";

    case "scheduled":
      return "scheduled";

    case "ready":
      return "ready";

    case "error":
      return "error";

    default:
      return "total";
  }
}

/* =====================================================
 * 🎯 公開API（安全版）
 * ===================================================== */

export const getStatusTheme = (status: JobStatus): StatusTheme => {
  const key = resolveTheme(status);
  return baseThemes[key];
};

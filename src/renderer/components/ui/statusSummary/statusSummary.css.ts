// src/renderer/components/ui/statusSummary/statusSummary.css.ts

import {
  createVar,
  style,
  styleVariants,
  type StyleRule,
} from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";
import { getStatusTheme } from "@renderer/styles/tokens/statusTheme";
import type { JobStatus } from "@shared/types/operation/operationTypes";

const glowShadowVar = createVar();

export const container = style([
  themeTransition,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    width: "100%",
    flex: 1,
    minWidth: 0,
    position: "relative",
    isolation: "isolate",
  },
]);

export const statusItem = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: "max-content",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  // 各ボタン単位で描画レイヤーを完全隔離
  position: "relative",
  isolation: "isolate",
  transform: "translateZ(0)",
});

/** 🎯 数値バッジのベーススタイル */
export const valueBadge = style([
  themeTransition,
  {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "32px",
    borderRadius: tokens.radius.md,
    fontFamily: tokens.font.mono,
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    backgroundColor: tokens.color.bg.base,
    boxShadow: tokens.shadow.raised.low,
    transform: "translateZ(0)",

    // ホバー時の発光をリペイントなしの GPU 合成（opacity 遷移）で処理する擬似要素
    "::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: tokens.radius.md,
      boxShadow: glowShadowVar,
      opacity: 0,
      transition: `opacity ${tokens.transition.ease}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      [`${statusItem}:hover &::before`]: {
        opacity: 1,
      },
    },
  },
]);

export const label = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  transition: `color ${tokens.transition.ease}`,
  selectors: {
    [`${statusItem}:hover &`]: {
      color: tokens.color.text.hover,
    },
  },
});

const createVariantStyle = (
  color: string,
  glow: string | undefined,
): StyleRule => ({
  color,
  vars: {
    [glowShadowVar]: glow
      ? `${tokens.shadow.raised.low}, ${glow}`
      : tokens.shadow.raised.low,
  },
});

const createStatusVariant = (status: JobStatus): StyleRule => {
  const theme = getStatusTheme(status);

  return createVariantStyle(theme.color, theme.glow);
};

const totalVariant = createVariantStyle(
  tokens.color.status.total,
  tokens.shadow.glow.total,
);

/** 🎯 各ステータスごとのバッジスタイルを小文字キーで定義 */
export const valueBadgeVariants = styleVariants({
  progress: totalVariant,
  total: totalVariant,

  success: createStatusVariant("success"),
  running: createStatusVariant("running"),
  scriptRunning: createStatusVariant("scriptRunning"),
  waiting: createStatusVariant("waiting"),
  scheduled: createStatusVariant("scheduled"),
  ready: createStatusVariant("ready"),
  needsAction: createStatusVariant("needsAction"),
  error: createStatusVariant("error"),
});

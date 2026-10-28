// src/renderer/components/ui/statusSummary/statusSummary.css.ts

import { style, styleVariants, type StyleRule } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";
import { getStatusTheme } from "@renderer/styles/statusTheme";
import type { JobStatus } from "@shared/types/operation/operationTypes";

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

    // 🎯 描写隔離（ホバー時の Glow 効果による全域ペイント波及の遮断）
    position: "relative",
    isolation: "isolate",
    transform: "translateZ(0)",
  },
]);

export const statusItem = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: tokens.space.xs,
  flex: 1,
  minWidth: "max-content", // 🎯 コンテンツ（ラベル・バッジ）の最小幅以下への潰れを防止
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
});

/** 🎯 数値バッジのベーススタイル */
export const valueBadge = style([
  themeTransition,
  {
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
  },
]);

export const label = style({
  fontSize: tokens.font.size.xs,
  fontWeight: tokens.font.weight.bold,
  color: tokens.color.text.base,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap", // 🎯 ラベル文字列のテキスト折り返しを防止
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
  selectors: {
    [`${statusItem}:hover &`]: {
      boxShadow: glow
        ? `${tokens.shadow.raised.low}, ${glow}`
        : tokens.shadow.raised.low,
    },
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

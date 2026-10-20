// src/renderer/components/ui/statusSummary/statusSummary.css.ts

import { style, styleVariants, type StyleRule } from "@vanilla-extract/css";
import { themeTransition, tokens } from "@renderer/styles/tokens";
import { getStatusTheme } from "@renderer/styles/statusTheme";

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

/** 🎯 各ステータスごとのバッジスタイルを小文字キーで定義 */
export const valueBadgeVariants = styleVariants({
  progress: createVariantStyle(
    tokens.color.status.total,
    tokens.shadow.glow.total,
  ),
  total: createVariantStyle(
    tokens.color.status.total,
    tokens.shadow.glow.total,
  ),

  success: (() => {
    const t = getStatusTheme("success");
    return createVariantStyle(t.color, t.glow);
  })(),

  running: (() => {
    const t = getStatusTheme("running");
    return createVariantStyle(t.color, t.glow);
  })(),

  scriptRunning: (() => {
    const t = getStatusTheme("scriptRunning");
    return createVariantStyle(t.color, t.glow);
  })(),

  waiting: (() => {
    const t = getStatusTheme("waiting");
    return createVariantStyle(t.color, t.glow);
  })(),

  scheduled: (() => {
    const t = getStatusTheme("scheduled");
    return createVariantStyle(t.color, t.glow);
  })(),

  ready: (() => {
    const t = getStatusTheme("ready");
    return createVariantStyle(t.color, t.glow);
  })(),

  error: (() => {
    const t = getStatusTheme("error");
    return createVariantStyle(t.color, t.glow);
  })(),
});

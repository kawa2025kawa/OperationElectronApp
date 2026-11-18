// src/renderer/styles/global/surfaces.css.ts

import { style, type StyleRule } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

/** ブランドグラデーションによるテキストクリップの StyleRule（selectors 内での展開用） */
export const brandGradientTextRule: StyleRule = {
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/** ブランドグラデーションによるテキストクリップ */
export const brandGradientText = style(brandGradientTextRule);

/** ::before 疑似要素を用いた GPU 合成ネオングロー用ルールを生成する */
export function createBeforeGlowRule(
  boxShadow: string,
  options?: {
    readonly inset?: number;
    readonly borderRadius?: string;
    readonly duration?: string;
    readonly willChange?: string;
  },
): NonNullable<StyleRule["::before"]> {
  return {
    content: '""',
    position: "absolute",
    inset: options?.inset ?? -1,
    borderRadius: options?.borderRadius ?? "inherit",
    boxShadow,
    opacity: 0,
    transition: `opacity ${options?.duration ?? tokens.transition.glow}`,
    pointerEvents: "none",
    ...(options?.willChange ? { willChange: options.willChange } : {}),
  };
}

/**
 * ホバー時にシアン発光（::before 疑似要素のフェード）と文字色ハイライトを
 * 行・カード単位で発火させる共通サーフェススタイル
 */
export const interactiveGlowCard = style({
  position: "relative",
  backgroundColor: tokens.color.bg.base,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.raised.low,
  color: tokens.color.text.base,
  isolation: "isolate",
  transition: `color ${tokens.transition.fast}`,

  "::before": createBeforeGlowRule(tokens.shadow.glowRaised.md, {
    inset: 0,
    duration: tokens.transition.normal,
    willChange: "opacity",
  }),

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    "&:hover::before": {
      opacity: 1,
    },
  },
});

/** 単一行テキストの省略表示 */
export const textEllipsis = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

/** キーボード操作時の共通フォーカスリング */
export const focusRing = style({
  selectors: {
    "&:focus-visible": {
      outline: `2px solid ${tokens.color.accent.neonCyan}`,
      outlineOffset: "2px",
    },
  },
});
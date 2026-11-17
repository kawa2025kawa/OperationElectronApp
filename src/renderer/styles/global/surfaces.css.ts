// src/renderer/styles/global/surfaces.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";

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

  "::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    boxShadow: tokens.shadow.glowRaised.md,
    opacity: 0,
    transition: `opacity ${tokens.transition.normal}`,
    pointerEvents: "none",
    willChange: "opacity",
  },

  selectors: {
    "&:hover": {
      color: tokens.color.text.hover,
    },
    "&:hover::before": {
      opacity: 1,
    },
  },
});

/** ブランドグラデーションによるテキストクリップ */
export const brandGradientText = style({
  backgroundImage: tokens.gradient.brand,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
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

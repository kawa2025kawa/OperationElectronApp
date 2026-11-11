// src/renderer/components/ui/button/buttonBase.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

/**
 * 全ボタン共通の基底スタイル
 * - 描画分離（ホバー・クリック時の周囲領域へのペイント波及を防止）
 * - 非活性（disabled）時の共通表現
 * - テーマ遷移アニメーション
 */
export const baseButton = style([
  themeTransition,
  {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    cursor: "pointer",
    outline: "none",
    border: "none",
    textDecoration: "none",
    userSelect: "none",
    position: "relative",
    isolation: "isolate",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transition: `transform ${tokens.transition.ease}, color ${tokens.transition.ease}, border-color ${tokens.transition.ease}, background-color ${t}, opacity ${tokens.transition.fast}`,

    selectors: {
      "&:disabled": {
        opacity: 0.35,
        cursor: "not-allowed",
        pointerEvents: "none",
        backgroundColor: tokens.color.bg.base,
        borderColor: tokens.color.border.subtle,
        color: tokens.color.text.base,
        boxShadow: tokens.shadow.pressed.low,
        filter: "grayscale(60%)",
        textShadow: "none",
      },
    },
  },
]);

/**
 * ネオンシアン発光・ホバー・アクティブ共通スタイル
 * ホバー発光を ::before の opacity 遷移（GPU 合成）に統一
 */
export const neonGlowButton = style([
  baseButton,
  {
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.high,

    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: "inherit",
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      opacity: 0,
      transition: `opacity ${smoothGlow}`,
      pointerEvents: "none",
      willChange: "opacity",
    },

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.accent.neonCyan,
        borderColor: tokens.color.accent.neonCyan,
      },
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "scale(0.95)",
      },
    },
  },
]);

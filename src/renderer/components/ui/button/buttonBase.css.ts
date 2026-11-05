// src/renderer/components/ui/button/buttonBase.css.ts

import { style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { themeTransition } from "@renderer/styles/tokens/theme.css";

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
    transition: `transform ${tokens.transition.ease}, box-shadow ${tokens.transition.ease}, color ${tokens.transition.ease}, border-color ${tokens.transition.ease}, background-color ${tokens.transition.normal}, opacity ${tokens.transition.fast}`,

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
 */
export const neonGlowButton = style([
  baseButton,
  {
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    border: `1px solid ${tokens.color.border.default}`,
    boxShadow: tokens.shadow.raised.high,

    selectors: {
      "&:hover:not(:disabled)": {
        color: tokens.color.accent.neonCyan,
        borderColor: tokens.color.accent.neonCyan,
        boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.raised.high}`,
      },
      "&:active:not(:disabled)": {
        boxShadow: tokens.shadow.pressed.low,
        transform: "scale(0.95)",
      },
    },
  },
]);

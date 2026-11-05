// src/renderer/components/ui/button/pollingToggleButton/pollingToggleButton.css.ts

import { keyframes, style } from "@vanilla-extract/css";
import { tokens } from "@renderer/styles/tokens/semantic.contract";
import { baseButton } from "../buttonBase.css";

// オンライン時のシアン発光パルス（サイズ変更なし・光の波紋のみ）
const pulse = keyframes({
  "0%": {
    boxShadow: `0 0 0 0 ${tokens.color.accent.neonCyan}, 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
  "70%": {
    boxShadow: `0 0 0 6px rgba(0, 0, 0, 0), 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
  "100%": {
    boxShadow: `0 0 0 0 rgba(0, 0, 0, 0), 0 0 8px ${tokens.color.accent.neonCyan}`,
  },
});

// ふわっと光らせる0.8秒のイージング
const smoothGlow = "0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
const t = tokens.transition.normal;

export const button = style([
  baseButton,
  {
    flexDirection: "row",
    whiteSpace: "nowrap",
    gap: tokens.space.md,
    width: "13rem",
    height: "3rem",
    padding: `0 ${tokens.space.lg}`,
    border: `1px solid ${tokens.color.border.default}`,
    borderRadius: tokens.radius.full,
    fontFamily: tokens.font.base,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    backgroundColor: tokens.color.bg.base,
    color: tokens.color.text.base,
    boxShadow: tokens.shadow.raised.md,
    // 位置変化（transform）は一切含めず、背景・枠線・影・文字色を遷移
    transition: `background-color ${t}, border-color ${smoothGlow}, box-shadow ${t}, color ${t}`,

    // シアンの光（外側グロー）とインセット影を重ねるレイヤー
    "::before": {
      content: '""',
      position: "absolute",
      inset: -1,
      borderRadius: tokens.radius.full,
      boxShadow: `${tokens.shadow.glow.cyan}, ${tokens.shadow.pressed.low}`,
      opacity: 0,
      transition: `opacity ${smoothGlow}`,
      pointerEvents: "none",
    },

    selectors: {
      // 1. ボタン本体のテキスト色
      "&:hover:not(:disabled)": {
        color: tokens.color.text.hover,
      },
      // ホバー時に 0.8秒かけてシアンの光とインセット影をじわーっと最大化
      "&:hover:not(:disabled)::before": {
        opacity: 1,
      },
      // 監視中（ON状態）は常時発光
      "&[aria-pressed='true']": {
        borderColor: tokens.color.border.accent,
      },
      "&[aria-pressed='true']::before": {
        opacity: 1,
      },
    },
  },
]);

export const indicator = style({
  position: "relative",
  zIndex: 1,
  display: "grid",
  placeItems: "center",
  width: "1em",
  height: "1em",
  flexShrink: 0,
});

export const dot = style({
  width: "0.6em",
  height: "0.6em",
  borderRadius: tokens.radius.full,
  backgroundColor: tokens.color.text.base,
  opacity: 0.5,
  transition: `background-color ${t}, opacity ${t}`,

  selectors: {
    [`${button}[aria-pressed='true'] &`]: {
      backgroundColor: "transparent",
      backgroundImage: tokens.gradient.brand,
      opacity: 1,
      animation: `${pulse} 2s infinite ease-in-out`,
    },
  },
});

export const label = style({
  position: "relative",
  zIndex: 1,
  letterSpacing: "0.05em",
  lineHeight: 1.2,
});

export const textSpan = style({
  display: "inline-block",
  // 親要素 (button) の文字色を常に継承
  color: "inherit",
  transition: `color ${t}`,

  selectors: {
    // 監視中（ON状態）のブランドグラデーションテキストを適用
    [`${button}[aria-pressed='true'] &`]: {
      backgroundImage: tokens.gradient.brand,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    },
  },
});
